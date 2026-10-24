import type { TranslationStrings } from '../types';

// English fallback until 'tr' is translated.
const help: TranslationStrings = {
  'help.title': 'Yardım ve belgeler',
  'help.search': 'Belgelerde ara…',
  'help.contents': 'İçindekiler',
  'help.noResults': 'Eşleşen sayfa yok.',
  'help.errorTitle': 'Bu sayfa yüklenemedi',
  'help.errorBody': "Yardım içeriği TREK wiki'sinden alınır. Bağlantınızı kontrol edip yeniden deneyin.",

  // center
  'help.center.button': 'Bu ekran için yardım',
  'help.center.title': 'Yardım',
  'help.center.onThisScreen': 'Bu ekranda',
  'help.center.screens': 'Ekranlar',
  'help.center.thisScreen': 'Geçerli',
  'help.center.subScreens': '{count} alt ekran',
  'help.center.subScreens.one': '{count} alt ekran',
  'help.center.subScreensLabel': 'Alt ekranlar',
  'help.center.guidesCount': '{count} kılavuz',
  'help.center.guidesCount.one': '{count} kılavuz',
  'help.center.goToScreen': '{screen} ekranına git',
  'help.center.overview': 'Genel bakış',
  'help.center.howTo': 'Nasıl yaparım…',
  'help.center.searchPlaceholder': 'Kılavuzlarda ve belgelerde ara…',
  'help.center.searchEmpty': '“{query}” için sonuç bulunamadı.',
  'help.center.searchGuides': 'Kılavuzlar',
  'help.center.searchDocs': 'Belgeler',
  'help.center.searchError': 'Arama şu anda kullanılamıyor.',
  'help.center.back': 'Geri',
  'help.center.close': 'Yardımı kapat',
  'help.center.steps': '{count} adım',
  'help.center.steps.one': '{count} adım',
  'help.center.step': '{n}. adım',
  'help.center.stepsLabel': 'Adımlar',
  'help.center.stepOf': 'Adım {n} / {total}',
  'help.center.screenshot': 'Ekran görüntüsü',
  'help.center.result': 'Sonuç',
  'help.center.tips': 'Bilmekte fayda var',
  'help.center.related': 'İlgili',
  'help.center.openDocs': "Yardım ve Belgeler'de aç",
  'help.center.docsSection': 'Belgelerde',
  'help.center.noContext': 'Bu ekran için henüz kılavuz yok.',
  'help.center.noContextHint': 'Belgelerde arayın ya da ne aradığınızı bize söyleyin.',
  'help.center.feedback': 'Eksik bir şey mi var?',
  'help.center.feedbackLink': 'GitHub’da bize bildirin',
  'help.center.discord': 'Discord’da sorun',
  'help.center.quick': 'Hızlı',
  'help.center.guide': 'Kılavuz',
  'help.center.tour': 'Tanıtım turu',
  'help.center.imageAlt': '“{title}” kılavuzunun {n}. adımı',

  // ctx
  'help.ctx.dashboard.title': 'Pano',
  'help.ctx.dashboard.summary':
    'Pano tüm seyahatlerinizi gösterir. Üstteki biniş kartı biçimindeki kart, süren ya da sıradaki seyahati gösterir. Altındaki satır şimdiye kadar ne kadar seyahat ettiğinizi sayar; kartlar ise planladığınız, arşivlediğiniz ve tamamladığınız her seyahati listeler.',
  'help.ctx.dashboard.bullet.1':
    'Biniş kartı: devam eden ya da sıradaki seyahat; tarihleri, yol arkadaşları, yerleri ve geri sayımıyla birlikte. Seyahati açmak için karta tıklayın. Sağ üst köşedeki dört düğme seyahati düzenler, çoğaltır, arşivler ya da siler.',
  'help.ctx.dashboard.bullet.2':
    'Seyahat istatistikleri: tüm seyahatlerinizde ziyaret edilen ülkeler, seyahatler, yolda geçen günler ve uçtuğunuz mesafe.',
  'help.ctx.dashboard.bullet.3':
    "Seyahat kartları, Planlandı, Arşivlendi ve Tamamlandı'ya göre filtrelenmiş şekilde, ızgara ya da liste olarak. Üstlerindeki arama kutusu tüm seyahatlerinizi aynı anda; başlığa, tarihe ya da seyahatteki bir yere göre tarar. Seyahati düzenleme, çoğaltma, arşivleme ve silme düğmeleri her kartın fotoğrafının sağ üst köşesindedir.",
  'help.ctx.dashboard.bullet.4':
    "Sağdaki widget'lar: para birimi çevirici, Koleksiyonlar (Koleksiyonlar eklentisi açıksa), dünya saatleri, yaklaşan rezervasyonlar ve eklentilerin widget'ları. Yerleşik olanları Ayarlar, Görünüm bölümünden kapatabilirsiniz.",
  'help.ctx.dashboard.bullet.5': '“Yeni Seyahat” kartı ve sağ alt köşedeki düğme, ikisi de yeni bir seyahat başlatır.',

  // create-trip
  'help.guide.create-trip.title': 'Seyahat oluşturun',
  'help.guide.create-trip.goal': 'Ad, tarihler ve kapak fotoğrafıyla yeni bir seyahat başlatın.',
  'help.guide.create-trip.step.1':
    '“Yeni Seyahat”e tıklayın. Seyahatlerinizin sonundaki kart ve sağ alt köşedeki düğme de aynı işi yapar.',
  'help.guide.create-trip.step.2': 'Seyahate bir ad verin. Gereken tek alan bu; gerisini sonra ekleyebilirsiniz.',
  'help.guide.create-trip.step.3':
    "Bir başlangıç ve bir bitiş tarihi seçin. TREK her tarih için bir gün oluşturur, böylece programınızı planlamaya başlayabilirsiniz. Tarihler henüz belli değil mi? İkisini de boş bırakın ve bunun yerine Gün sayısı'nı girin.",
  'help.guide.create-trip.step.4':
    "İsteğe bağlı: kapak fotoğrafı ekle. Kendi fotoğrafını yükle, sürükleyip bırak ya da yapıştır; ya da varış yerini Unsplash'ta ara.",
  'help.guide.create-trip.step.5': '“Yeni Seyahat Oluştur”a tıklayın.',
  'help.guide.create-trip.result':
    'Seyahat panonuzda görünür. Sıradaki seyahatinizse en üstteki biniş kartında gösterilir.',
  'help.guide.create-trip.tip.1':
    'Tarihleri sonradan değiştirebilirsiniz. Rezervasyonlar varsa TREK, bunların günlerle birlikte kaydırılıp kaydırılmayacağını sorar.',
  'help.guide.create-trip.tip.2':
    'Burada seçtiğiniz seyahat para birimi, tüm maliyetlerin çevrildiği para birimidir. Gideceğiniz yerin para birimini seçin.',

  // edit-trip
  'help.guide.edit-trip.title': 'Seyahati düzenleyin',
  'help.guide.edit-trip.goal': 'Bir seyahati yeniden adlandırın, tarihlerini değiştirin ya da ayarlarını düzenleyin.',
  'help.guide.edit-trip.step.1': 'Seyahat kartının (veya biniş kartının) sağ üst köşesindeki kalem simgesine tıkla.',
  'help.guide.edit-trip.step.2':
    'Değiştirmek istediklerini düzenle: ad, açıklama, tarihler, kapak, para birimi, hatırlatıcı veya seyahat arkadaşları.',
  'help.guide.edit-trip.step.3': '“Güncelle”ye tıklayın.',
  'help.guide.edit-trip.result': 'Kart, seyahatin tüm üyeleri için hemen güncellenir.',
  'help.guide.edit-trip.tip.1':
    'Rezervasyonları olan bir seyahatin başlangıç tarihini kaydırırsan rezervasyonların da kaydırılıp kaydırılmayacağı sorulur. Bir seyahati kısaltırsan silinecek günler ve bu günlerde planlananlar listelenir. Değişiklik ancak “Günleri kaldır ve kaydet”e tıkladıktan sonra kaydedilir.',

  // cover-image
  'help.guide.cover-image.title': 'Kapak fotoğrafı belirleyin',
  'help.guide.cover-image.goal': 'Seyahatinize kartında ve biniş kartında görünen bir görsel ekleyin.',
  'help.guide.cover-image.step.1': 'Seyahatin düzenleme formunu, kartındaki kalem simgesiyle açın.',
  'help.guide.cover-image.step.2':
    "Kapak Görseli altında bir fotoğrafı sürükleyip bırakın ya da yapıştırın, yüklemek için tıklayın veya bir varış yeri yazıp Unsplash'ta ara'ya tıklayın.",
  'help.guide.cover-image.step.3': 'Bir fotoğraf seçin ve “Güncelle” düğmesine tıklayın.',
  'help.guide.cover-image.result':
    'Fotoğraf seyahatle birlikte kaydedilir ve seyahatin listelendiği her yerde görünür.',
  'help.guide.cover-image.tip.1':
    'Unsplash aramasından seçtiğiniz fotoğraflarda fotoğrafçıya otomatik olarak atıf yapılır; kendi yüklemeleriniz sunucunuzda kalır.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Seyahati çoğaltın',
  'help.guide.duplicate-trip.goal': 'Bir seyahati yenisi için şablon olarak kullanın.',
  'help.guide.duplicate-trip.step.1': 'Kartın sağ üst köşesindeki çoğaltma simgesine tıklayın.',
  'help.guide.duplicate-trip.step.2':
    'Nelerin kopyalanıp nelerin kopyalanmayacağını oku, sonra “Seyahati kopyala”ya tıkla.',
  'help.guide.duplicate-trip.result':
    'Panelinde bir kopya belirir. Adı, orijinalin adı ve ardından (kopya) şeklindedir. Kopyayı yeniden adlandırabilir ve tarihlerini değiştirebilirsin.',
  'help.guide.duplicate-trip.tip.1':
    'Günler, yerler, turlar ve yol gezisi rotaları, rezervasyonlar, bütçe kalemleri, paket listeleri, yapılacaklar ve gün notları kopyalanır; paket listeleri ve yapılacaklar işaretsiz olarak kopyalanır. Üyeler, sohbet, anketler, dosyalar ve paylaşım bağlantıları kopyalanmaz.',

  // archive-trip
  'help.guide.archive-trip.title': 'Seyahati arşivleyin ve arşivden çıkarın',
  'help.guide.archive-trip.goal': 'Bir seyahati silmeden listenizden kaldırın, istediğiniz zaman geri getirin.',
  'help.guide.archive-trip.step.1': 'Kartın sağ üst köşesindeki arşiv simgesine tıkla.',
  'help.guide.archive-trip.step.2': 'Seyahati yeniden görmek için kartların üstündeki filtreyi “Arşivlendi” yapın.',
  'help.guide.archive-trip.step.3':
    "Kartta Geri yükle'ye tıklayın. Seyahat Planlandı durumuna döner; tarihleri geçmişse Tamamlandı durumuna.",
  'help.guide.archive-trip.result':
    'Arşivlenen seyahatler tüm verilerini korur. Yalnızca panoda ve tüm seyahatleri içeren takvim akışında artık gösterilmezler.',

  // delete-trip
  'help.guide.delete-trip.title': 'Seyahati silin',
  'help.guide.delete-trip.goal': 'Bir seyahati kalıcı olarak silin.',
  'help.guide.delete-trip.step.1': 'Kartın sağ üst köşesindeki çöp kutusu simgesine tıklayın.',
  'help.guide.delete-trip.step.2':
    'Sil ile onaylayın. Pencerede seyahatin adı yazar, böylece doğru seyahati sildiğinizden emin olursunuz.',
  'help.guide.delete-trip.result':
    'Seyahat; günleri, yerleri, rezervasyonları ve dosyalarıyla birlikte silinir. Bu işlem geri alınamaz; emin değilseniz seyahati arşivleyin.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Tamamlanan seyahatleri bulun, ızgara ve liste görünümü arasında geçin',
  'help.guide.filter-and-view.goal': 'Biten veya arşivlenen seyahatleri görün ve size uygun görünümü seçin.',
  'help.guide.filter-and-view.step.1':
    'Kartların üstündeki “Planlandı”, “Arşivlendi” ve “Tamamlandı” seçeneklerini kullanın. “Tamamlandı”, bitiş tarihi geçmiş tüm seyahatleri gösterir.',
  'help.guide.filter-and-view.step.2':
    'Kompakt listeye geçmek için liste simgesine tıklayın, ızgaraya dönmek için yeniden tıklayın.',
  'help.guide.filter-and-view.result': 'Pano, düzeninizi bu cihazda hatırlar.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Tüm seyahatlere takviminizden abone olun',
  'help.guide.calendar-feed.goal':
    'Her etkin seyahatin günlerini ve rezervasyonlarını takvim uygulamanızda görün; hep güncel kalır.',
  'help.guide.calendar-feed.step.1': 'Görünüm düğmesinin yanındaki takvim simgesine tıklayın.',
  'help.guide.calendar-feed.step.2':
    "Takvim aboneliğini etkinleştir'e tıklayın. TREK özel bir akış bağlantısı oluşturur.",
  'help.guide.calendar-feed.step.3':
    '“Google Takvim’e ekle” ya da “Apple Takvim / Outlook’a ekle”ye tıkla. Başka bir takvim uygulaması için “Veya bağlantıyı elle kopyalayın” bölümünü aç ve bağlantıyı oradan kopyala.',
  'help.guide.calendar-feed.result':
    'Etkin her seyahat takviminizde görünür ve otomatik güncellenir. Arşivlenen seyahatler ile 90 günden uzun süre önce biten seyahatler dahil edilmez.',
  'help.guide.calendar-feed.tip.1':
    'Bağlantıyı gizli tut: ona sahip olan herkes akışı okuyabilir. Bağlantı başkalarının eline geçerse “Yeniden oluştur” sana yeni bir bağlantı verir ve eski bağlantı çalışmaz olur. “Kapat” bağlantıyı tamamen kaldırır.',

  // widgets
  'help.guide.widgets.title': 'Pano bileşenlerini seçin',
  'help.guide.widgets.goal': 'İstatistik satırını ve sağdaki bileşenleri gösterin ya da gizleyin.',
  'help.guide.widgets.step.1': 'Sağ üstteki avatar menüsünü açın ve “Ayarlar”ı seçin.',
  'help.guide.widgets.step.2': '“Görünüm” sekmesine geçin.',
  'help.guide.widgets.step.3':
    "“Pano widget'ı” altında her widget'ı Masaüstü ve Mobil için ayrı ayrı aç veya kapat. “Sağ kenar çubuğu” sağ sütunun tamamını tek seferde kapatır.",
  'help.guide.widgets.step.4': 'Panoya geri dönün. Değişiklik hemen uygulanır.',
  'help.guide.widgets.result':
    'Bileşenleri gizlediğinizde seyahatlerinize daha fazla yer kalır. Düzeni ortalamak için sağ kenar çubuğunun tamamını kapatın.',
  'help.guide.widgets.link': 'Görünüm ayarlarını aç',

  // currency-widget
  'help.guide.currency-widget.title': 'Para birimi çevirin',
  'help.guide.currency-widget.goal': 'Bir tutarı güncel kurlarla iki para birimi arasında çevirin.',
  'help.guide.currency-widget.step.1': 'Tutarı yazın ve iki para birimini seçin.',
  'help.guide.currency-widget.step.2': 'Aradaki ok iki para birimini yer değiştirir; dairesel ok kuru yeniler.',
  'help.guide.currency-widget.result': 'Para birimi çiftiniz hesabınızda saklanır, yani her cihazda aynıdır.',
  'help.guide.currency-widget.tip.1':
    "Kurlar ücretsiz Frankfurter hizmetinden gelir. Widget'ın köşesindeki dairesel ok en güncel kurları getirir.",

  // timezones-widget
  'help.guide.timezones-widget.title': 'Dünya saatleri ekleyin',
  'help.guide.timezones-widget.goal': 'Gideceğiniz yerlerdeki yerel saati görün.',
  'help.guide.timezones-widget.step.1':
    "“Saat dilimleri” widget'ında + işaretine tıkla, bir şehir ara (örneğin Lizbon) ve listeden seç.",
  'help.guide.timezones-widget.step.2': 'Bir saati kaldırmak için üzerine gelin ve sağda beliren × işaretine tıklayın.',
  'help.guide.timezones-widget.result': 'Saatleriniz hesabınıza kaydedilir.',
  'help.guide.search-trips.title': 'Seyahatlerinizde arayın',
  'help.guide.search-trips.goal':
    'Bir seyahati adından, tarihinden ya da içinde planladığınız bir yerden bulun; arşivlenmiş seyahatler de dahildir.',
  'help.guide.search-trips.step.1':
    'Kartların üstündeki “Gezi veya yer ara” alanına yazın. Liste yazdıkça süzülür; planlanan, arşivlenen ve tamamlanan seyahatlerin hepsinde aynı anda arar.',
  'help.guide.search-trips.step.2':
    'Bir seyahat yerlerinden biri sayesinde eşleştiyse o yer seyahat başlığının altında gösterilir. Tüm seyahatlerinizi yeniden görmek için kutudaki x’e tıklayın ya da Escape’e basın.',
  'help.guide.search-trips.result':
    'Panoda yalnızca eşleşen seyahatler görünür. Tüm seyahatleri yeniden görmek için arama kutusunu temizleyin.',
  'help.guide.search-trips.tip.1':
    'Tarihe göre de arayabilirsiniz: bir ay ve yıl yazın, örneğin Mayıs 2027 ya da 2027-05, o aydaki seyahatler listelenir.',
  'help.guide.search-trips.tip.2':
    'Arama etkinken “Planlandı”, “Arşivlendi” ve “Tamamlandı” anahtarı uygulanmaz, böylece yanlış bir filtre hiçbir seyahati gizlemez.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Tatil',
  'help.ctx.vacay.summary':
    'Tatil, kişisel izin planlayıcınızdır: yılda kaç izin gününüz olduğunu, hangilerini kaydettiğinizi ve kaç gününüzün kaldığını gösterir. Izgara tüm yılı gösterir. Kenar çubuğunda yıl seçici, birlikte plan yaptığınız kişiler, sizinle paylaşılan takvimler, renk açıklaması ve hakedişiniz yer alır.',
  'help.ctx.vacay.bullet.1':
    'Yıl ızgarası: on iki ay kartı, gün başına bir hücre. Bir günü kaydetmek ya da temizlemek için tıklayın. Küçük mavi nokta, bir seyahatin zaten kapsadığı günleri işaretler.',
  'help.ctx.vacay.bullet.2':
    'Alttaki araç çubuğu: adınızı ve renginizi taşıyan ilk düğme tatil işler. Şirket Tatili, tüm şirketin izinli olduğu günleri işaretler. Yarım gün ve Serbest zaman, bir tıklamanın neyi işleyeceğini değiştirir; Yarım gün şirket tatillerinde de kullanılabilir.',
  'help.ctx.vacay.bullet.3':
    'Hakediş: seçili yıl için Gün, Kullanılmış ve kalan gün sayısı; yanında devreden ve serbest zaman günleri. Kartı daraltmak için başlığına tıklayın.',
  'help.ctx.vacay.bullet.4':
    '“Kişiler”, planınızı paylaşan insanlardır; her biri kendi renginde görünür. “Paylaşılan Takvimler” başkalarının izin günlerini renkli halkalar olarak gösterir. Bunları düzenleyemezsiniz.',
  'help.ctx.vacay.bullet.5':
    'Ayarlar şunları kapsar: hafta sonları, haftanın başlangıcı, devir, izin yılın, şirket tatilleri, resmi ve okul tatili takvimleri ve biriyle birlikte plan yaparken “Birleşmeyi Kaldır”.',
  // log-day
  'help.guide.log-day.title': 'İzin günü kaydedin',
  'help.guide.log-day.goal': 'Yıl ızgarasında bir izin gününü işaretleyin ve bakiyenizin güncellendiğini görün.',
  'help.guide.log-day.step.1':
    'Alttaki araç çubuğunda ilk düğmeye bak. Düğmede adın ve rengin görünüyorsa bir güne tıklamak senin için o güne tatil günü işler.',
  'help.guide.log-day.step.2':
    'Herhangi bir ay kartında bir güne tıklayın. Gün renginizle dolar ve “Kullanılmış” bir gün artar.',
  'help.guide.log-day.step.3': 'Günü temizlemek için aynı güne yeniden tıklayın.',
  'help.guide.log-day.result':
    'Gün kaydedildi. Gün, Kullanılan ve Kalan değerleri hemen güncellenir; planınıza dahil olan herkes değişikliği anında görür.',
  'help.guide.log-day.tip.1':
    '“Ayarlar”da “Hafta Sonlarını Engelle” açıkken hafta sonları işlenemez. Daha önce işlenmiş bir hafta sonu günü yine de temizlenebilir.',
  'help.guide.log-day.tip.2':
    'Hücredeki mavi nokta, seyahatlerinizden birinin o günü kapsadığını gösterir; böylece iznin ve seyahatin nerede çakıştığını görebilirsiniz.',
  // half-day
  'help.guide.half-day.title': 'Yarım gün kaydedin',
  'help.guide.half-day.goal': 'Öğleden sonra izin alın ve hakedişinizden yalnızca yarım gün harcayın.',
  'help.guide.half-day.step.1':
    'Araç çubuğunda “Yarım gün” seçeneğini açın. Turuncu nokta, ızgarada yarım günün işaretidir.',
  'help.guide.half-day.step.2': 'Bir güne tıklayın. Gün 0,5 olarak kaydedilir ve köşesinde turuncu bir nokta görünür.',
  'help.guide.half-day.step.3':
    'İşiniz bitince “Yarım gün” seçeneğini yeniden kapatın. Farklı ayarlara sahip bir yarım güne tıklarsanız gün, geçerli ayarlara dönüşür.',
  'help.guide.half-day.result':
    'Kullanılan değeri 0,5 artar. Yarım gün ile Serbest zaman birbirinden bağımsızdır; yani yarım serbest zaman günü de kaydedebilirsiniz.',
  'help.guide.half-day.tip.1':
    'Araç çubuğu bir sonraki tıklamanızın koyacağı işareti her zaman gösterir; kaydetmeden önce kontrol edebilirsiniz.',
  // comp-day
  'help.guide.comp-day.title': 'Serbest zaman kaydedin',
  'help.guide.comp-day.goal': 'İzin günü harcamadan serbest zaman (telafi izni) kullanın.',
  'help.guide.comp-day.step.1':
    'Araç çubuğunda “Serbest zaman” seçeneğini açın. Çizgili daire, ızgarada telafi gününün işaretidir.',
  'help.guide.comp-day.step.2': 'Bir güne tıklayın. Gün, düz renk yerine renginizde çapraz çizgilerle dolar.',
  'help.guide.comp-day.result':
    'Telafi günleri izin hakkı kutucuklarının yanında sayılır ve “Kalan” değerini hiç azaltmaz.',
  'help.guide.comp-day.tip.1':
    'Mesai fazlasını izin olarak kullandığınızda, esnek çalışma saatlerinde ya da yerine verilen izin günlerinde bunu kullanın: yıllık izin sayılmayan her türlü izin buraya girer.',
  // entitlement
  'help.guide.entitlement.title': 'Hakedişinizi ayarlayın',
  'help.guide.entitlement.goal': 'Yıllık izin gününüzün kaç olduğunu Tatil’e bildirin.',
  'help.guide.entitlement.step.1':
    'Kenar çubuğundaki Hakediş kartında, satırınızdaki Gün kutucuğuna tıklayın. Kart kapalıysa başlığına tıklayarak açın.',
  'help.guide.entitlement.step.2': "Gün sayınızı yazıp Enter'a basın. Eski değeri korumak için Escape'e basın.",
  'help.guide.entitlement.result': '“Kalan”, hakedişiniz, varsa devir ve kullandığınız günlerden yeniden hesaplanır.',
  'help.guide.entitlement.tip.1':
    'Her yılın kendi izin hakkı vardır, bu yüzden buradaki değişiklik yalnızca seçili yılı etkiler.',
  // years
  'help.guide.years.title': 'Yıl ekleyin ve yıllar arasında geçiş yapın',
  'help.guide.years.goal': 'Gelecek yılı şimdiden planlayın ya da geçen yıla göz atın.',
  'help.guide.years.step.1':
    'Sonraki yılı eklemek için yılın sağındaki + işaretine, önceki yılı eklemek için soldaki + işaretine tıklayın.',
  'help.guide.years.step.2': 'Yıllar arasında oklarla ya da alttaki yıl etiketleriyle geçiş yapın.',
  'help.guide.years.step.3':
    'Bir yılı kaldırmak için yıl etiketinin üzerine gelin ve küçük eksi işaretine tıklayın. Bu, yılın tüm kayıtlarını da siler; bu yüzden dikkatle onaylayın.',
  'help.guide.years.result': 'Her yılın kendi hakedişi ve kayıtları vardır. Devir bir yılı diğerine bağlar.',
  // company-holidays
  'help.guide.company-holidays.title': 'Şirket tatillerini işaretleyin',
  'help.guide.company-holidays.goal':
    'Tüm şirketin tatil olduğu günleri, kimsenin izin hakkından düşmeden işaretleyin.',
  'help.guide.company-holidays.step.1':
    "Ayarlar'ı açın ve “Şirket Tatilleri”nin açık olduğundan emin olun. Varsayılan olarak açıktır. Araç çubuğu bu modu yalnızca açıkken gösterir.",
  'help.guide.company-holidays.step.2': "Izgaraya döndüğünüzde araç çubuğunda Şirket Tatili'ni seçin.",
  'help.guide.company-holidays.step.3':
    'Günlere tıkla. Kehribar rengine döner ve göstergede görünür. Temizlemek için güne bir kez daha tıkla.',
  'help.guide.company-holidays.result':
    'Plana dahil olan herkes şirket tatillerini görebilir; bunlar Kalan değerini hiçbir zaman azaltmaz.',
  'help.guide.company-holidays.tip.1':
    'Plana dahil olan herkes şirket tatillerini düzenleyebilir; bunları kimin güncelleyeceğini aranızda kararlaştırın.',
  // public-holidays
  'help.guide.public-holidays.title': 'Resmi tatilleri gösterin',
  'help.guide.public-holidays.goal': 'Ülkenizin ya da bölgenizin resmi tatillerini ızgaraya ekleyin.',
  'help.guide.public-holidays.step.1': "Ayarlar'ı açın ve “Resmi Tatiller” seçeneğini açın.",
  'help.guide.public-holidays.step.2':
    '“Takvim ekle”ye tıkla, sonra ülkeyi ve gerekiyorsa bölgeyi seç. İstersen bir renk ve etiket de verebilirsin. Sonra “Ekle”ye tıkla.',
  'help.guide.public-holidays.step.3': "Ayarlar'ı kapatın. Tatiller ızgarada ve göstergede görünür.",
  'help.guide.public-holidays.result': 'Resmi tatiller takvimin renginde işaretlenir ve izin hakkınızdan hiç düşmez.',
  'help.guide.public-holidays.tip.1':
    'Birden fazla takvim ekleyebilirsiniz, örneğin kendi bölgenizin takvimini ve planınıza dahil ettiğiniz bir iş arkadaşınızın bölgesinin takvimini.',
  // school-holidays
  'help.guide.school-holidays.title': 'Okul tatillerini gösterin',
  'help.guide.school-holidays.goal': 'Bölgenizin okul tatillerini kendi izin günlerinizin yanında görün.',
  'help.guide.school-holidays.step.1': '“Ayarlar”ı açın ve “School Holidays”i açın.',
  'help.guide.school-holidays.step.2':
    "Takvim ekle'ye tıklayıp ülkeyi seçin. Ülke takvimini bölgelere ayırıyorsa bölgeyi ya da grubu da seçin, sonra Ekle'ye tıklayın.",
  'help.guide.school-holidays.step.3':
    "Ayarlar'ı kapatın. Okul tatilleri takvimde takvimin renginde gölgelenir ve günlerinin alt kenarında renkli bir şerit görünür.",
  'help.guide.school-holidays.result': 'Okul tatilleri yalnızca takvimde gösterilir, kimsenin izin hakkından düşmez.',
  'help.guide.school-holidays.tip.1':
    'Bölgeniz eksik mi? Yöneticiniz okul tatillerini Yönetici, Kişiselleştirme, Okul tatilleri altından elle düzenleyebilir.',
  // weekends
  'help.guide.weekends.title': 'Hafta sonlarını engelleyin ve haftanın başlangıcını ayarlayın',
  'help.guide.weekends.goal': 'Hafta sonlarını hesabınızın dışında bırakın ve haftayı istediğiniz günde başlatın.',
  'help.guide.weekends.step.1': '“Ayarlar”ı açın.',
  'help.guide.weekends.step.2':
    "Hafta Sonlarını Engelle'yi açın, sonra Hafta sonu günleri altında hafta sonu sayılacak günleri seçin.",
  'help.guide.weekends.step.3': "Hafta başlangıcı altında Pazartesi ya da Pazar'ı seçin.",
  'help.guide.weekends.result': 'Engellenen günler ızgarada gri görünür ve yanlışlıkla kaydedilemez.',
  // leave-year
  'help.guide.leave-year.title': 'İzin yılınızı ayarlayın',
  'help.guide.leave-year.goal':
    'İzin hakkınızı Ocak-Aralık yerine mali yıl üzerinden ya da işe giriş tarihinizden başlayarak hesaplayın.',
  'help.guide.leave-year.step.1': "Ayarlar'ı açın ve “Tatil yılı” bölümünü bulun.",
  'help.guide.leave-year.step.2':
    '“Takvim”, “Mali” (başladığı ay ve günle) ya da “İşe giriş” (işe başladığınız tarihle) seçeneğini seçin.',
  'help.guide.leave-year.result':
    'Hakediş, kullanılan günler ve devir bu döneme göre hesaplanır; ızgara da dönemin ilk ayıyla başlar.',
  'help.guide.leave-year.tip.1': 'Bu ayar kişiseldir: ortak bir planda herkes kendi izin yılını ve rakamlarını korur.',
  // carry-over
  'help.guide.carry-over.title': 'Kullanılmayan günleri sonraki yıla devredin',
  'help.guide.carry-over.goal': 'Bir dönemin sonunda kalan günleri sonraki döneme ekleyin.',
  'help.guide.carry-over.step.1': "Ayarlar'ı açın.",
  'help.guide.carry-over.step.2': '“Devret” seçeneğini açın.',
  'help.guide.carry-over.result':
    'Devredilen miktar tüm yıllarınız boyunca yeniden hesaplanır ve izin hakkının altında gösterilir.',
  'help.guide.carry-over.tip.1': 'Kapatırsanız tüm devir bakiyeleri sıfırlanır.',
  // invite
  'help.guide.invite.title': 'Biriyle birlikte plan yapın',
  'help.guide.invite.goal':
    'Planınızı başka bir TREK kullanıcısının planıyla birleştirin; böylece ikiniz de izin günlerinizi tek bir ızgarada görürsünüz.',
  'help.guide.invite.step.1': 'Kişiler kartındaki kişi simgesine tıklayın.',
  'help.guide.invite.step.2': "Kullanıcıyı seçin ve Davet Gönder'e tıklayın.",
  'help.guide.invite.step.3':
    "Karşı taraf Tatil'i bir sonraki açışında bildirim ve “Birleştirme İsteği” alır. O zamana kadar davet “Beklemede” olarak görünür; iptal etmek için üzerine gel.",
  'help.guide.invite.result':
    'İki plan birleşir: her kişinin bir rengi olur, birbiriniz adına gün kaydedebilirsiniz ve her şey canlı olarak eşitlenir.',
  'help.guide.invite.tip.1':
    'Birleşmeyi geri almak için “Ayarlar”da “Ayır”a tıkla. Herkesin kayıtları kendi planına geri döner.',
  'help.guide.invite.tip.2':
    'Karşı taraf yalnızca sizin günlerinizi görecekse, takvimleri birleştirmek yerine takviminizi paylaşın.',
  // share-calendar
  'help.guide.share-calendar.title': 'Takviminizi salt okunur paylaşın',
  'help.guide.share-calendar.goal':
    'Planınızı değiştirmesine izin vermeden, ne zaman izinde olduğunuzu birinin görmesini sağlayın.',
  'help.guide.share-calendar.step.1': '“Paylaşılan Takvimler” kartındaki paylaşma simgesine tıkla.',
  'help.guide.share-calendar.step.2': 'Kullanıcıyı seçin ve “Paylaş”a tıklayın. Kabul gerekmez.',
  'help.guide.share-calendar.step.3':
    "Seninle paylaşılan takvimler kartın üstünde görünür: gizlemek veya göstermek için birine tıkla ya da kaldırmak için üzerine gelip x'e tıkla. “Sizin paylaştıklarınız” altında bir adın üzerine gel ve “Paylaşımı durdur”a tıkla.",
  'help.guide.share-calendar.result':
    'İzin günleriniz onların ızgarasında renkli bir halka olarak görünür. Paylaştığınız hiçbir şeyi düzenleyemezler.',
  'help.guide.share-calendar.tip.1':
    'Paylaşma ve birleştirme birbirinden bağımsızdır: bir kişiyle planı birleştirip başkalarıyla takvimi paylaşabilirsiniz.',
  'help.guide.share-calendar.tip.2': 'Halkalı bir günün üzerine gelin, kimin ne kadar süre izinli olduğunu görürsünüz.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    "Atlas, dünya haritasında nerelere gittiğinizi gösterir: bir seyahatin sizi götürdüğü her ülke renklenir, TREK'i kullanmadan önce gittiğiniz ülkeleri ise elle eklersiniz. Bölgeleri görmek için yakınlaştırın, hâlâ görmek istediğiniz yerler için bir yapılacaklar listesi tutun ve rakamlarınızı alttaki cam panelden okuyun.",
  'help.ctx.atlas.bullet.1':
    'Harita: ziyaret edilen her ülkenin kendine ait sabit bir rengi vardır, planlanan ülkelerin çevresi kesik çizgilidir, dilek listesindeki ülkeler çapraz çizgilidir, diğer tüm ülkeler gridir. Seyahatlerini, yerlerini, ilk ve son ziyaret tarihini görmek için bir ülkenin üzerine gelin.',
  'help.ctx.atlas.bullet.2':
    'Üstteki arama: bir ülke veya yer yaz. Henüz gitmediğin bir ülke seçersen açılır penceresi açılır. Gittiğin bir ülke seçersen kartı panelde görünür. Bir yer seçersen harita onun bölgesini açar ve bölgeyi işaretleyebilirsin.',
  'help.ctx.atlas.bullet.3':
    'Sağ üstteki “Planlanan ülkeleri göster”: yaklaşan seyahatlerinizin ülkelerini haritada gösterir. Anahtar yalnızca yaklaşan seyahatiniz varsa görünür.',
  'help.ctx.atlas.bullet.4':
    'Alttaki panel: İstatistikler sekmesinde ülkeler (planlananlar yanlarında), bölgeler, seyahatler, yerler, şehirler, günler, kıtalar, serginiz ve bu yılki seyahatleriniz yer alır. Yapılacaklar Listesi sekmesinde henüz gitmek istediğiniz yerler bulunur. Turlar eklentisi açıksa, yaptığınız turların mesafesini ve tırmanışını gösteren bir Turlar sekmesi de olur.',
  'help.ctx.atlas.bullet.5':
    'Bölgeler: yakınlaştırdığınızda harita eyaletleri ve illeri gösterir. Birine tıklayarak onu işaretleyebilir, işaretini kaldırabilir ya da yapılacaklar listesine ekleyebilirsiniz.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: eklenti bağlıyken istatistiklerin solundaki panel, dilekleri tamamlandı olarak işaretler ve kayıtlarınızdan ülke ekler. Bunu yalnızca siz onayladıktan sonra yapar.',
  // mark-country
  'help.guide.mark-country.title': 'Bir ülkeyi ziyaret edildi olarak işaretleyin',
  'help.guide.mark-country.goal':
    "TREK'i kullanmadan önce gittiğiniz bir ülkeyi ekleyin, harita ve sayacınız onu da içersin.",
  'help.guide.mark-country.step.1': 'Ülkenin adını haritanın üstündeki arama kutusuna yazın.',
  'help.guide.mark-country.step.2':
    'Ülkeyi listeden seçin. Harita ülkeye gider ve ülke için bir açılır pencere belirir.',
  'help.guide.mark-country.step.3': '“Ziyaret edildi olarak işaretle”yi seçin.',
  'help.guide.mark-country.result':
    'Ülke haritada bir renk alır ve “Ülkeler” sayısı bir artar. Bu renk kalıcıdır: başka ülkeler işaretlediğinizde diğer ülkelerin renkleri değişmez.',
  'help.guide.mark-country.tip.1':
    'Haritada gri bir ülkeye tıklamak aynı açılır pencereyi açar. Küçük ülkelerde arama daha güvenilirdir.',
  'help.guide.mark-country.tip.2':
    'Elle işaretlediğiniz bir ülke, oraya giden seyahatlerin tarihleri ne olursa olsun her zaman ziyaret edilmiş sayılır.',
  // unmark-country
  'help.guide.unmark-country.title': 'İşaretlediğiniz bir ülkeyi kaldırın',
  'help.guide.unmark-country.goal': 'Elle işaretlediğiniz bir ülkeyi haritadan kaldırın.',
  'help.guide.unmark-country.step.1':
    'Ülkeyi arayıp seçin ya da haritada tıklayın. Kendi işaretlediğiniz bir ülke için açılır pencere, ülkenin kaldırılıp kaldırılmayacağını sorar.',
  'help.guide.unmark-country.step.2': '“Kaldır” ile onaylayın.',
  'help.guide.unmark-country.result': 'Ülke yeniden gri olur ve sayılmaz.',
  'help.guide.unmark-country.tip.1':
    'Bu yöntemle yalnızca elle işaretlediğiniz ülkeler kaldırılabilir. Seyahati ya da yeri olan bir ülke, o seyahatler ya da yerler kaldırılana kadar işaretli kalır. Elle işaretlediğiniz bir ülke için “Kaldır” paneldeki ayrıntı kartında da bulunur.',
  // country-details
  'help.guide.country-details.title': 'Bir ülkede neler yaptığınızı görün',
  'help.guide.country-details.goal': 'Gittiğiniz bir ülkeyi açın ve sizi oraya götüren seyahatlere geçin.',
  'help.guide.country-details.step.1': 'Haritanın üstündeki arama kutusuna ziyaret ettiğiniz bir ülkenin adını yazın.',
  'help.guide.country-details.step.2':
    'Ülkeyi seçin. Harita oraya gider ve alttaki panelde bir kart belirir. Kartta ülkenin bayrağı, yerleri, seyahatleri ve ziyaret edilen bölgeleri için rozetler, ayrıca ilk üç seyahatin her biri için bir etiket görünür.',
  'help.guide.country-details.result': 'Seyahati planlayıcıda açmak için bir seyahat çipine tıklayın.',
  'help.guide.country-details.tip.1':
    'Haritada ülkenin üzerine gelirseniz aynı rakamlar ile ilk ve son ziyaret görünür.',
  // planned-countries
  'help.guide.planned-countries.title': 'Gideceğiniz ülkeleri gösterin',
  'help.guide.planned-countries.goal':
    'Yaklaşan seyahatlerinizin ülkelerini, ziyaret edilmiş saymadan haritada gösterin.',
  'help.guide.planned-countries.step.1':
    'Sağ üstteki “Planlanan ülkeleri göster” anahtarını açın. Yanındaki sayı kaç planlanmış ülke olduğunu gösterir.',
  'help.guide.planned-countries.step.2':
    'Planlanan bir ülkeyi arayıp seçin: panelde “Planlandı” yazar ve haritadaki ipucu ne zaman gideceğinizi gösterir.',
  'help.guide.planned-countries.result':
    'Planlanan ülkeler kesik çizgili bir çerçeveyle görünür, böylece gittiğiniz ülkelerle karışmaz. Anahtar seçiminizi hatırlar.',
  'help.guide.planned-countries.tip.1':
    'Bir ülke, oraya yapılan seyahat başladığında gidilmiş sayılır. Devam eden bir seyahat de sayılır. Tarihi olmayan seyahatler istatistiklere hiç dahil edilmez.',
  'help.guide.planned-countries.tip.2': 'Anahtar yalnızca yaklaşan seyahatleriniz olduğu sürece görünür.',
  // regions
  'help.guide.regions.title': 'Bir bölgeyi işaretleyin',
  'help.guide.regions.goal': 'Yalnızca ülkeleri değil, gittiğiniz eyaletleri, illeri ya da vilayetleri de işaretleyin.',
  'help.guide.regions.step.1':
    'Eyalet ve il sınırları görünene kadar bir ülkeye yakınlaştır. Ülkeyi arayıp seçersen harita yeterince yakına gider.',
  'help.guide.regions.step.2':
    'Bir bölgeye tıklayın. Üzerine gelince adı görünür. Açılır pencere bölgeyi ve ülkesini gösterir.',
  'help.guide.regions.step.3': '“Ziyaret edildi olarak işaretle”yi seçin.',
  'help.guide.regions.result':
    'Bölge, ülkenin rengiyle dolar. Bir bölgeyi işaretlerseniz ülke de, daha önce işaretli değilse, gidilmiş sayılır.',
  'help.guide.regions.tip.1':
    'Gidilmiş bir bölgeye tıkladığınızda, bölgeyi kendiniz işaretlemiş olsanız da bir yer yüzünden eklenmiş olsa da “Kaldırmak” seçeneği çıkar.',
  'help.guide.regions.tip.2':
    'Gerçek yerlerinizin bulunduğu bölgeler otomatik işaretlenir. Bunlar için bir şey yapmanız gerekmez.',
  // search-place
  'help.guide.search-place.title': 'Bir yer bulun ve bölgesini işaretleyin',
  'help.guide.search-place.goal': "Bir şehrin hangi bölgede olduğunu bilmeden Münih'i arayarak Bavyera'yı işaretle.",
  'help.guide.search-place.step.1':
    'Arama kutusuna bir şehir, bir simge yapı ya da bir adres yazın. Önce ülkeler gelir; eşleşen yerler altlarında “Yerler” başlığı altında görünür.',
  'help.guide.search-place.step.2': 'Yeri seçin. Harita oraya kayar ve noktanın hangi bölgede olduğunu bulur.',
  'help.guide.search-place.step.3':
    'O bölge için “Ziyaret edildi olarak işaretle”yi seçin; henüz gitmediyseniz “Yapılacaklar listesine ekle”yi seçin.',
  'help.guide.search-place.result':
    'Bölge ve ülke işaretlenir. Harita paketinde bölge verisi olmayan ülkelerde bunun yerine ülkenin kendisi işaretlenir.',
  'help.guide.search-place.tip.1':
    "Yerler TREK'in her yerinde kullanılan aynı aramadan gelir, yani yöneticinizin ayarladığı sağlayıcı kullanılır.",
  // bucket-country
  'help.guide.bucket-country.title': 'Bir ülkeyi yapılacaklar listesine ekleyin',
  'help.guide.bucket-country.goal':
    'Ziyaret ettiğiniz ülkelerden ayrı olarak, haritada gitmek istediğiniz ülkelerin dilek listesini tutun.',
  'help.guide.bucket-country.step.1': 'Ülkeyi arayıp seçin ya da haritada üzerine tıklayın.',
  'help.guide.bucket-country.step.2': '“Yapılacaklar listesine ekle”yi seçin.',
  'help.guide.bucket-country.step.3':
    'Ne zaman gideceğinizi biliyorsanız ay ve yıl seçin, sonra “Yapılacaklar listesine ekle” ile onaylayın.',
  'help.guide.bucket-country.result':
    'Ülke, gittikten sonra alacağı renkte çapraz çizgilerle gösterilir ve panelin “Yapılacaklar Listesi” sekmesinde yer alır.',
  'help.guide.bucket-country.tip.1':
    'Ülke listeye eklendikten sonra aynı açılır pencerede “Yapılacaklar listesinden kaldır” seçeneği çıkar.',
  'help.guide.bucket-country.tip.2':
    'Her hedef tarih için tek kayıt vardır: aynı ülke iki farklı ay için listede olabilir, ama aynı ay için iki kez olamaz.',
  // bucket-place
  'help.guide.bucket-place.title': 'Dilek listesine bir yer ekleyin',
  'help.guide.bucket-place.goal':
    'Gitmek istediğiniz bir şehri, görülecek bir yeri ya da bir adresi koordinatları ve hedef tarihiyle kaydedin.',
  'help.guide.bucket-place.step.1': 'Alttaki panelde “Yapılacaklar Listesi” sekmesini açın.',
  'help.guide.bucket-place.step.2': '“Yer ekle”ye tıklayın.',
  'help.guide.bucket-place.step.3':
    'Adı yazıp arama düğmesine basın, yere koordinat eklenmesi için eşleşmeyi seçin. İsterseniz yalnızca bir ad yazıp aramayı atlayabilirsiniz.',
  'help.guide.bucket-place.step.4': 'İsterseniz bir ay ve yıl seçin, sonra “Ekle” düğmesine tıklayın.',
  'help.guide.bucket-place.result':
    'Yer, hedef tarihiyle birlikte yapılacaklar listenizin en üstünde görünür. Üzerine gelirseniz yeri kaldıran × belirir.',
  'help.guide.bucket-place.tip.1':
    'Dawarich bir dileği yalnızca koordinatları varsa sonradan tamamlandı olarak işaretleyebilir. Bunu, kayıtlarınız orada bulunduğunuzu gösterdiğinde yapar.',
  // stats
  'help.guide.stats.title': 'İstatistiklerinizi okuyun',
  'help.guide.stats.goal': 'Paneldeki rakamların neyi saydığını ve neyi saymadığını öğrenin.',
  'help.guide.stats.step.1':
    'Ülke, gerçekten bulunduğunuz farklı ülkelerin sayısıdır. Planlanan ülkeler sayının altında görünür ve bu sayıya dahil değildir. Bölge, bulunduğunuz eyalet ve illerin sayısıdır. Seyahat, Yer ve Gün tüm seyahatlerinizin toplamlarıdır. Şehir, yerlerinizin adreslerinden hesaplanır, yani bir tahmindir.',
  'help.guide.stats.step.2':
    'Kıtalar bölümü, kıta başına ziyaret edilen ülkeleri gösterir. Antarktika, oraya gittikten sonra satıra eklenir. Sonra seriniz (en az bir seyahat yaptığınız ardışık yıllar) ve bu yıl kaç seyahat yaptığınız gelir.',
  'help.guide.stats.result':
    'Rakamlar, seyahatlerinizi planladıkça kendiliğinden güncellenir. Burada bakımını yapmanız gereken bir şey yok.',
  'help.guide.stats.tip.1':
    'Şehirler aranmaz, adres metninden alınır. Bu yüzden “Osteria Francescana, Italy” gibi kısa bir adres ya da bir vilayet adıyla biten adres, şehir yerine bölge olarak sayılabilir.',
  'help.guide.stats.tip.2':
    'Elle işaretlediğiniz ülkeler Ülke sayısına ve kıtalara dahil edilir, ancak seyahat, yer ya da gün eklemez.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Kayıtlarınızdan ülke ekleyin',
  'help.guide.dawarich-countries.goal':
    'Son bir yılda hangi ülkelerde bulunduğunuzu Dawarich ile öğrenin ve onayladıklarınızı haritaya ekleyin.',
  'help.guide.dawarich-countries.step.1':
    'Dawarich eklentisi bağlıyken haritanın altında, istatistiklerin solunda iki kutucuklu bir Dawarich paneli görünür. “Ülkeler” kutucuğuna tıklayın.',
  'help.guide.dawarich-countries.step.2':
    'Pencere “Ülkeler” sekmesinde açılır. “Ülkeleri ara”ya tıklayın: TREK, kayıtlarınızın son 12 ayda kapsadığı ülkeleri ve şehirleri ay ay okur; bu yüzden biraz sürebilir. Atlas’ınızda henüz olmayan her ülke bayrağı, şehir sayısı ve ilk şehrin adıyla listelenir. Her ülke varsayılan olarak işaretlidir. Bir ülkeyi dışarıda bırakmak için satırına tıklayın.',
  'help.guide.dawarich-countries.step.3':
    'Sağ alttaki düğmeyle onaylayın; beş satır işaretliyken düğmede “5 ülke ekle” yazar. Pencere kaç ülkenin eklendiğini söyler. Pencereyi kapattığınızda harita zaten güncellenmiştir.',
  'help.guide.dawarich-countries.result':
    "Onayladığınız ülkeler haritada renklenir, Ülke sayısına eklenir ve Dawarich'ten geldiği kaydedilir. Elle işaretlediğiniz ülkeler değişmez.",
  'help.guide.dawarich-countries.tip.1':
    "Atlas'ta zaten gidilmiş görünen ülkeler, elle, bir seyahatten ya da önceki bir kontrolden gelmiş olsun, dışarıda bırakılır, böylece kendi işaretleriniz hiç değişmez. Daha önce Atlas'tan kaldırdığınız bir ülke, burada onayladığınızda yeniden eklenir.",
  'help.guide.dawarich-countries.tip.2':
    "TREK bir ülke adını eşleştiremezse ad atılmaz, satırların altında listelenir. “Yeniden kontrol et” Dawarich'e yeniden sorar. Listenin altındaki not son 12 ayın kontrol edildiğini belirtir. Bu süreyi değiştiremezsiniz.",
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Dilekleri kayıtlarınıza göre işaretleyin',
  'help.guide.dawarich-wishes.goal':
    'Dilek listenizdeki yerlerden hangilerine gerçekten ulaştığınızı öğrenin ve ulaştığınız tarihle birlikte işaretleyin.',
  'help.guide.dawarich-wishes.step.1':
    'Haritanın altında, istatistiklerin solundaki Dawarich panelinde “Dilek listesi”ne tıklayın.',
  'help.guide.dawarich-wishes.step.2':
    'Pencere “Dilek listesi” sekmesinde açılır. “Dilek listesini denetle”ye tıklayın: TREK, koordinatı olan her kayıt için kayıtlarınıza bakar. Ulaştığınız bir dilek, ne kadar yaklaştığınız, ne kadar kaldığınız ve günüyle birlikte listelenir ve varsayılan olarak işaretlidir. Daha önce işaretlediğiniz bir dilekte “Zaten işaretlenmiş” yazar. Listenin altındaki bir not, koordinatı olmayan kayıtların sayısını gösterir ve kuralı da belirtir: bir dilek, yerinde 250 m yakınlıkta ve 20 dakika durulduktan sonra ulaşılmış sayılır.',
  'help.guide.dawarich-wishes.step.3':
    'Sağ alttaki düğmeyle onaylayın. İki satır işaretliyken düğmede “2 tanesini işaretle” yazar. Sonra pencereyi kapatın ve yanındaki panelde “Yapılacaklar Listesi” sekmesini açın.',
  'help.guide.dawarich-wishes.result':
    'Her dilek, bugünün değil, konaklamanın tarihiyle yeşil bir onay işareti alır. İpucunda “Dawarich kayıtlarınızdan işaretlendi” yazar. Geri almak için tarihe tıklayın.',
  'help.guide.dawarich-wishes.tip.1':
    'Yanından geçmek sayılmaz: yere yakın olmanız ve orada bir süre kalmanız gerekir. Birden fazla kalış uygunsa en uzunu kullanılır. Koordinatı olmayan bir dilek kontrol edilemez, bu yüzden yerleri yalnızca adla değil, “Yer ekle” içindeki arama ile ekleyin.',
  'help.guide.dawarich-wishes.tip.2':
    'Her kontrol en fazla 50 kayda bakar; henüz işaretlenmemiş olanlardan başlar. Daha fazlası varsa TREK bunu size söyler. Daha önce işaretlenmiş bir dilek kendi tarihini korur.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Koleksiyonlar',
  'help.ctx.collections.summary':
    'Koleksiyonlar, herhangi bir seyahatten bağımsız kütüphanendir: bulduğun ve saklamak istediğin yerlerin adlandırılmış listeleri; her yerin durumu “Fikir”, “Gitmek istiyorum” veya “Gidildi” olabilir. “Turlar” açıksa bir seyahatten sakladığın turların tamamı da burada yer alır. Yerler ve turlar seyahatlere ve seyahatlerden kopyalanır, hiçbir zaman bağlanmaz; bu yüzden bir liste ile bir seyahat birbirini asla değiştirmez.',
  'help.ctx.collections.bullet.1':
    'Soldaki liste sütununda kendi listeleriniz, sizinle paylaşılan listeler, henüz yanıtlamadığınız davetler ve sahibi olduğunuz tüm listelerin içeriğini birleştiren “Tüm kayıtlılar” yer alır. “Yeni liste” ve dosyadan içe aktarma en üsttedir.',
  'help.ctx.collections.bullet.2':
    'Açık listenin başlığında listenin rengi, kapağı, açıklaması ve bağlantıları, üyeler, sağda da Düzenle (yalnızca sahibi için), Dışa aktar ve Paylaş görünür. Sizinle paylaşılan bir listede Paylaş düğmesi Paylaşılan yazar.',
  'help.ctx.collections.bullet.3':
    'Yerlerin üstündeki filtre satırı: yer eklemek için +, Durum, Kategori, Puan ve Sırala açılır listeleri, Seç için onay kutusu simgesi ve Bir geziden içe aktar için bulut simgesi. Etiket filtresi bu satırda yalnızca harita gösterilmiyorsa yer alır.',
  'help.ctx.collections.bullet.4':
    'Yer satırları: fotoğraf, ad ve adres, etiketler ve kategori, sağda da durum etiketi. Etikete bir kez tıklamak durumu bir sonrakine geçirir.',
  'help.ctx.collections.bullet.5':
    'Sağdaki harita: koordinatı olan her yer için bir iğne. Üst çubukta Haritayı genişlet (harita tam ekrandayken Listeyi göster), etiketleri yöneten düğmeyle birlikte etiket filtresi ve Yer ara kutusu bulunur. Bir iğneye tıklarsanız o yer açılır.',
  'help.ctx.collections.bullet.6':
    'Ayrıntı sayfası: kapağı, kategoriyi, durumu, yıldız puanını, etiketleri, açıklamayı ve bağlantıları görmek için bir satıra tıkla. Kapaktaki kamera fotoğrafı değiştirir. En altta “Düzenle”, “Geziye kopyala”, navigasyon düğmesi ve “Listeden kaldır” yer alır.',
  // create-list
  'help.guide.create-list.title': 'Liste oluşturun',
  'help.guide.create-list.goal':
    'Rengi ve kapağı olan, adlandırılmış yeni bir liste oluşturun, yerler eklemeye hazır olsun.',
  'help.guide.create-list.step.1': 'Liste kenar çubuğunun en üstündeki “Yeni liste” seçeneğine tıklayın.',
  'help.guide.create-list.step.2':
    'Listeye bir ad verin ve bir renk seçin. Kapak resmi, açıklama ve bağlantılar isteğe bağlıdır, bunları sonra “Düzenle” ile ekleyebilirsiniz.',
  'help.guide.create-list.step.3': '“Oluştur”a tıklayın.',
  'help.guide.create-list.result':
    'Liste boş açılır; doldurmanın iki yolu olarak “Yer ekle” ve “Bir geziden içe aktar” sunulur.',
  'help.guide.create-list.tip.1':
    'Kapak, kendi yüklediğiniz bir görsel ya da aynı iletişim kutusundaki Unsplash aramasıyla bulduğunuz bir fotoğraf olabilir.',
  // add-place
  'help.guide.add-place.title': 'Yer ekleyin',
  'help.guide.add-place.goal':
    'Bir yer bulun ve adı, kategorisi, durumu ve notlarıyla tek adımda açık listeye kaydedin.',
  'help.guide.add-place.step.1':
    'Yerlerin üstündeki filtre satırının başındaki + işaretine tıkla. Henüz boş olan bir listede sayfanın ortasındaki “Yer ekle”ye tıkla.',
  'help.guide.add-place.step.2':
    'Yeri arama alanına yazın ve bir sonuç seçin. Ad, adres ve koordinatlar sonuçtan otomatik doldurulur.',
  'help.guide.add-place.step.3':
    'Durumu ve isterseniz kategori, açıklama ve bağlantıları ayarlayın, sonra “Ekle”ye tıklayın. Pencere bir sonraki yer için açık kalır, “İptal” pencereyi kapatır.',
  'help.guide.add-place.result': 'Yer listede görünür; koordinatları varsa haritada da iğne olarak görünür.',
  'help.guide.add-place.tip.1':
    'Seyahatin içindeyken yer denetçisindeki ya da bir yerin menüsündeki “Koleksiyona kaydet”, seyahatten ayrılmadan bir seyahat yerini listeye ekler.',
  'help.guide.add-place.tip.2':
    'Liste size ait olmalı ya da editör veya yönetici olduğunuz bir liste olmalı; “Tüm kayıtlılar” ekranında ve yalnızca görüntüleyebildiğiniz listelerde + düğmesi yoktur.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Bir seyahatten yerleri içe aktarın',
  'help.guide.import-from-trip.goal':
    'Bir seyahatin tüm yerlerini tek tek kaydetmek yerine hepsini bir kerede listeye aktarın.',
  'help.guide.import-from-trip.step.1':
    'Filtre satırındaki bulut oklu içe aktarma düğmesine tıklayın. Liste boşsa aynı düğme “Yer ekle” düğmesinin yanındadır.',
  'help.guide.import-from-trip.step.2': 'Seyahatlerinizden birini seçin.',
  'help.guide.import-from-trip.step.3':
    'İstediğiniz yerleri işaretleyin. Listede zaten bulunan yerler soluk görünür. Seyahatin hiçbir gününde olmayan yerler baştan seçilidir. Her yer zaten bir günde yer alıyorsa tüm yeni yerler seçili gelir. Yalnızca yeniler, listede zaten olan yerleri gizler.',
  'help.guide.import-from-trip.step.4': '“İçe aktar”a tıklayın. Düğme her zaman kaç yerin ekleneceğini gösterir.',
  'help.guide.import-from-trip.result':
    'Yerler adı, adresi, koordinatları, açıklaması ve kategorisiyle listeye kopyalanır. Seyahatte hiçbir şey değişmez.',
  'help.guide.import-from-trip.tip.1':
    'TREK, aynı ada ya da koordinatlara sahip yerleri otomatik olarak atlar; bu yüzden iki kez içe aktarmanızda sakınca yoktur.',
  'help.guide.import-from-trip.tip.2':
    'Bir seyahatin yer listesinde seçim modu, elle seçtiğiniz yerler için bunun yerine Koleksiyona kaydet seçeneğini sunar.',
  // place-status
  'help.guide.place-status.title': 'Bir yerin durumunu ayarlayın',
  'help.guide.place-status.goal':
    'Neyin yalnızca fikir olduğunu, neyin kısa listede olduğunu ve nereleri gördüğünüzü takip edin.',
  'help.guide.place-status.step.1':
    'Bir yer satırının sağ ucundaki durum rozetine tıklayın. “Fikir” durumu “Gitmek istiyorum” olur.',
  'help.guide.place-status.step.2': '“Gidildi” için yeniden tıklayın, “Fikir”e dönmek için bir kez daha tıklayın.',
  'help.guide.place-status.result':
    'Rozet ve rengi hemen değişir, listenin üstündeki durum filtresindeki sayılar da güncellenir.',
  'help.guide.place-status.tip.1':
    "Durum yalnızca Koleksiyonlar'da bulunur. Bir yeri seyahate kopyaladığınızda durumu kopyalanmaz.",
  'help.guide.place-status.tip.2':
    'Bir seyahatten Koleksiyona kaydet, yerin bulunduğu her liste için bir durum etiketiyle Listeye kaydet penceresini açar. Yer panelinin seçim çubuğunda ise Listelerinde ziyaret edildi olarak işaretle bulunur.',
  // place-detail
  'help.guide.place-detail.title': 'Kayıtlı bir yeri açın',
  'help.guide.place-detail.goal':
    'Bir yer hakkındaki her şeyi görün ve yerle neler yapabileceğinize bakın: düzenleyin, bir geziye kopyalayın, yolu bulun, kaldırın.',
  'help.guide.place-detail.step.1':
    'Bir yer satırına tıklayın. Ayrıntı paneli listenin yanında açılır ve harita yere kayar.',
  'help.guide.place-detail.step.2':
    'En altta “Düzenle”, “Geziye kopyala”, yeri bir harita uygulamasında açan navigasyon düğmesi ve “Listeden kaldır” bulunur. Kapaktaki kamera, otomatik fotoğrafı kendi fotoğrafınla değiştirir.',
  'help.guide.place-detail.result':
    '“Düzenle” ile ad, kategori, etiketler, adres, koordinatlar, açıklama ve bağlantıları doğrudan panelde değiştirebilirsiniz.',
  'help.guide.place-detail.tip.1':
    "Yerin kendi resmi yoksa kapak otomatik alınır. Kendi yüklemen JPG, PNG, GIF, WebP veya HEIC olabilir ve 20 MB'a kadar olabilir. Kameranın yanındaki çöp kutusu simgesi otomatik fotoğrafı geri getirir.",
  'help.guide.place-detail.tip.2':
    'Sen de dahil her üye durumun altında yıldız puanı verebilir; filtre satırındaki “Puan” filtresi ortalamayı kullanır.',
  // labels
  'help.guide.labels.title': 'Yerleri etiketlerle gruplayın',
  'help.guide.labels.goal':
    'Ortak kategorilere ek olarak bir listeye semtler ya da günler gibi kendi etiketlerinizi verin.',
  'help.guide.labels.step.1':
    'Haritanın üstündeki etiketlerin yanındaki “Etiket ekle”ye tıkla (listede etiket olunca “Etiketleri yönet”). Harita gösterilmiyorsa düğme filtre satırının sonundadır.',
  'help.guide.labels.step.2':
    'Bir ad yazın, bir renk seçin ve “Etiket ekle”ye tıklayın. Var olan etiketleri aynı pencerede yeniden adlandırabilir, renklerini değiştirebilir ya da silebilirsiniz.',
  'help.guide.labels.step.3':
    "Seç'i açın, yerleri işaretleyin ve seçim çubuğunda Etiket ata'ya tıklayın. Sonra etiketleri seçip Etiket ata ile onaylayın. Tek bir yere, ayrıntı sayfasındaki Düzenle ile de etiket ekleyebilirsiniz.",
  'help.guide.labels.step.4':
    'Listede ve haritada yalnızca bu etiketlerden herhangi birini taşıyan yerleri görmek için haritanın üstündeki bir ya da birkaç etikete tıklayın. Bir etiketi filtreden çıkarmak için ona yeniden tıklayın.',
  'help.guide.labels.result':
    'Etiketli yerlerin etiketleri satırda görünür; etiket filtresi, görüntüleyenler dahil her üye için vardır.',
  'help.guide.labels.tip.1':
    'Etiketler, oluşturuldukları listeye aittir. Bir yeri başka bir listeye taşırsanız etiketleri silinir.',
  'help.guide.labels.tip.2': 'Etiketleri yönetmek ve atamak için listede düzenleme hakkınız olmalı.',
  // filter-select
  'help.guide.filter-select.title': 'Yerleri filtreleyin ve seçin',
  'help.guide.filter-select.goal': 'Listeyi filtreleyin ve birçok yeri aynı anda değiştirin.',
  'help.guide.filter-select.step.1':
    'Filtre satırındaki açılır listeleri kullanın: durum, kategori, asgari puan ve sıralama. Durum ve kategoride her seçeneğin kaç yerle eşleştiği görünür.',
  'help.guide.filter-select.step.2':
    "Açılır listelerin ardındaki onay kutusu simgesine, yani Seç'e tıklayın. Her satırda bir onay kutusu belirir ve bir seçim çubuğu açılır.",
  'help.guide.filter-select.step.3':
    'Yerleri işaretle ya da filtrenin gösterdiği tüm yerler için “Tümünü seç”i kullan, sonra “Etiket ata”, “Listeye taşı”, “Listeye çoğalt”, “Geziye kopyala” ya da “Sil”i seç. Taşıma ve silme yalnızca listenin sahibi veya yöneticisi için kullanılabilir.',
  'help.guide.filter-select.result': 'Eylemler seçimin tamamına aynı anda uygulanır. Sağdaki × seçim modunu kapatır.',
  'help.guide.filter-select.tip.1':
    '“Tümünü seç” yalnızca filtreyle eşleşen yerleri seçer. Tüm “Gitmek istiyorum” yerlerinizde işlem yapmak için “Gitmek istiyorum” ile filtreleyin ve “Tümünü seç”e tıklayın.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Yerleri bir seyahate kopyalayın',
  'help.guide.copy-to-trip.goal': 'Kayıtlı yerleri seyahatlerinizden birine durak olarak ekleyin.',
  'help.guide.copy-to-trip.step.1':
    '“Seç”i açıp yerleri işaretleyin ya da bir yeri açıp ayrıntı panelinden “Geziye kopyala”yı kullanın.',
  'help.guide.copy-to-trip.step.2': 'Seçim çubuğundaki “Geziye kopyala”ya tıklayın.',
  'help.guide.copy-to-trip.step.3': 'Seyahati seçin. Liste uzunsa arama kutusuyla daraltın.',
  'help.guide.copy-to-trip.result':
    'Yerler, o seyahatin yer listesine ad, açıklama, kategori, notlar, fiyat, koordinatlar, fotoğraf ve etiketlerle eklenir. Koleksiyonda hiçbir şey değişmez.',
  'help.guide.copy-to-trip.tip.1':
    'Paylaşılan bir listeyi yalnızca görüntüleyenler de bunu yapabilir. Yerler listeden kopyalanır, liste değişmez.',
  // share-list
  'help.guide.share-list.title': 'Bir listeyi biriyle paylaşın',
  'help.guide.share-list.goal': 'Bir listeyi bu TREK’teki başka kişilerle canlı olarak birlikte planlayın.',
  'help.guide.share-list.step.1': 'Listenizin üst alanındaki “Paylaş”a tıklayın.',
  'help.guide.share-list.step.2': 'Kullanıcıyı ve bir rol seçin: “Görüntüleyici”, “Editör” ya da “Yönetici”.',
  'help.guide.share-list.step.3':
    '“Davet gönder”e tıkla. Kişi, daveti liste panelinde veya bildiriminden kabul edene kadar beklemede görünür.',
  'help.guide.share-list.result':
    'Davet kabul edildiğinde liste, kişi için “Paylaşılan” altında görünür ve her değişiklik canlı eşitlenir. Üyeleri ve rollerini aynı pencereden düzenlemeye devam edebilirsiniz.',
  'help.guide.share-list.tip.1':
    'Görüntüleyiciler yerlere bakabilir, puan verebilir ve yerleri kendi seyahatlerine kopyalayabilir. Editörler yer ve etiket ekleyip düzenleyebilir. Yöneticiler ayrıca taşıyabilir ve silebilir.',
  'help.guide.share-list.tip.2':
    'Kişileri yalnızca liste sahibi davet edebilir ve çıkarabilir. Üyeler paylaşılan listeden kendileri ayrılabilir.',
  // export-list
  'help.guide.export-list.title': 'Bir listeyi dosya olarak dışa aktarın',
  'help.guide.export-list.goal':
    'Bir listeyi başka bir TREK sunucusundaki birine verin ya da bir harita uygulamasında açın.',
  'help.guide.export-list.step.1': 'Listenin üst alanındaki “Dışa aktar”a tıklayın.',
  'help.guide.export-list.step.2':
    'Listeyi başka bir TREK’te etiketleri ve durumuyla kullanmak için “TREK listesi”ni, OsmAnd, Organic Maps, Garmin ve yol noktası okuyan diğer uygulamalar için GPX’i seçin.',
  'help.guide.export-list.result': 'Dosya iner. Paylaşılan bir listenin her üyesi listeyi dışa aktarabilir.',
  'help.guide.export-list.tip.1':
    'Koordinatı olmayan bir yer GPX yol noktası olamaz; dışarıda bırakılır ve TREK kaç yerin dışarıda kaldığını söyler.',
  'help.guide.export-list.tip.2':
    "Puanlar, üyeler ve yüklenen fotoğraflar bilerek dışa aktarılmaz, çünkü bunlar listeye değil, bu TREK'e aittir.",
  // import-file
  'help.guide.import-file.title': 'Dosyadan bir liste içe aktarın',
  'help.guide.import-file.goal':
    'Bir TREK liste dosyasını ya da GPX dosyasını yeni bir liste olarak veya mevcut bir listeye aktarın.',
  'help.guide.import-file.step.1':
    'Liste çubuğunda “Yeni liste”nin yanındaki, yükleme oklu içe aktarma düğmesine tıklayın.',
  'help.guide.import-file.step.2':
    'Dosyayı seçin. TREK içe aktarmadan önce dosyanın içeriğini gösterir: adı, kaç yer ve kaç etiket olduğu.',
  'help.guide.import-file.step.3':
    '“Yeni liste”yi olduğu gibi bırak, istersen adı değiştir, sonra “İçe aktar”a tıkla. Ya da yerleri düzenleyebildiğin bir listeye eklemek için “Bir listeye ekle”yi seç ve “Listeye ekle”ye tıkla.',
  'help.guide.import-file.result':
    'Liste, içe aktarılan yerlerle açılır. Bir listeye içe aktarma yalnızca yer ekler. Listede zaten bulunan yerler durumlarını, notlarını ve etiketlerini korur.',
  'help.guide.import-file.tip.1':
    'GPX dosyasında adı olan her yol noktası bir yer olur. İzler çizgidir ve dışarıda bırakılır; önizleme bunun kaç nokta olduğunu söyler.',
  'help.guide.import-file.tip.2':
    'TREK listesi ya da GPX olmayan bir dosya reddedilir ve TREK nedenini gösterir. Tek bir yer okunamazsa yalnızca o yer atlanır, dosyanın tamamı atlanmaz.',
  // edit-list
  'help.guide.edit-list.title': 'Bir listeyi düzenleyin ya da silin',
  'help.guide.edit-list.goal':
    'Bir listenin adını, rengini, kapağını, açıklamasını ya da bağlantılarını değiştirin veya listeyi silin.',
  'help.guide.edit-list.step.1': 'Listenin üst alanındaki “Düzenle”ye tıklayın. Bunu yalnızca sahibi görür.',
  'help.guide.edit-list.step.2':
    "İstediğiniz değişikliği yapıp Kaydet'e tıklayın. Sol alttaki çöp kutusu simgesi (Listeyi sil), onayınızdan sonra listeyi tüm yerleriyle birlikte siler.",
  'help.guide.edit-list.result': 'Üstteki başlık yeni rengi, kapağı ve açıklamayı hemen gösterir.',
  'help.guide.edit-list.tip.1':
    'Bir listeyi silmek geri alınamaz. Bir kopyasını saklamak istiyorsanız önce dışa aktarın.',
  // all-saved
  'help.guide.all-saved.title': 'Tüm kitaplığınızda arayın',
  'help.guide.all-saved.goal': 'Sahip olduğunuz tüm listelerdeki yerleri aynı anda görün.',
  'help.guide.all-saved.step.1':
    "Liste rayında Tüm kayıtlılar'a tıklayın. Sahibi ya da ortak sahibi olduğunuz tüm listelerin yerleri tek bir görünümde toplanır.",
  'help.guide.all-saved.step.2':
    'Haritanın üstündeki Yer ara alanına yazın ve filtreleri her listedeki gibi kullanın. Seç burada da çalışır: listeler arasında taşıyabilir, çoğaltabilir, bir geziye kopyalayabilir ya da silebilirsiniz.',
  'help.guide.all-saved.result':
    'Bu görünüm kayıtlı tüm yerlerinizi bir arada gösterir. Burada yer ekleyemez veya içe aktaramazsınız, çünkü yerlerin ekleneceği tek bir liste yoktur.',
  'help.guide.all-saved.tip.1':
    "Etiketler ve saklanan turlar tek bir listeye aittir. Bu yüzden Tüm kayıtlılar'da ikisi de sunulmaz.",

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Seyahat',
  'help.ctx.journey.summary':
    'Journey, fotoğrafı öne çıkaran seyahat günlüğünüzdür. Her Journey bir ya da daha fazla seyahate bağlıdır; hikâye, fotoğraf, ruh hali ve hava durumu içeren kayıtlarla gün gün dolar. Bu ekran Journey’lerinizi listeler; yazmak için birini açın.',
  'help.ctx.journey.bullet.1':
    "Üstteki banner, devam eden journey'i ya da en son journey'ini girdi, fotoğraf ve yer sayılarıyla gösterir. “Yazmaya devam et” journey'i bugünün sayfasında açar. Bir seyahat yeni bittiğinde, bannerın üstünde çıkan “Seyahat yeni bitti” bannerı o seyahati journey'e dönüştürmeyi önerir.",
  'help.ctx.journey.bullet.2':
    "Tüm Journey'ler altında her journey için bir kart bulunur; kartta kapak, durum, tarihler ve sayılar yer alır. Bannerda gösterilen journey burada tekrar görünmez. Açmak için karta tıklayın.",
  'help.ctx.journey.bullet.3':
    'Izgaradaki son kart, “Yeni Journey oluştur”, seyahatlerinizden yola çıkarak yeni bir Journey başlatır.',
  // create-journey
  'help.guide.create-journey.title': 'Journey oluşturun',
  'help.guide.create-journey.goal': 'Bir seyahat için günlük başlatın, seyahatteki yerler öneri olarak hazır gelsin.',
  'help.guide.create-journey.step.1': 'Izgaradaki son kart olan “Yeni Journey oluştur” kartına tıklayın.',
  'help.guide.create-journey.step.2':
    "Bir ad ve isterseniz alt başlık verin, sonra Journey'in ait olduğu seyahatleri işaretleyin. Sayaç kaç yerin ekleneceğini gösterir.",
  'help.guide.create-journey.step.3': '“Journey Oluştur”a tıklayın.',
  'help.guide.create-journey.result':
    'Günlük açılır. Bağlı seyahatlerin her yeri, planlandığı her gün için bir kez olmak üzere, zaman çizelgesinde öneri olarak görünür. Her biri için bir kayıt yazabilirsiniz.',
  'help.guide.create-journey.tip.1': 'Daha fazla seyahat sonradan “Journey Ayarları”ndan bağlanabilir.',
  'help.guide.create-journey.tip.2': 'Seyahati olmayan bir Journey de olur; bu durumda kayıtları elle eklersiniz.',
  // open-journey
  'help.guide.open-journey.title': 'Bir Journey açın',
  'help.guide.open-journey.goal': 'Bir günlüğü açın ve nereden açıldığını görün.',
  'help.guide.open-journey.step.1':
    "Bir karta tıklayın. Her kartta kapak, tarihler ve Journey'de kaç kayıt, fotoğraf ve yer olduğu görünür.",
  'help.guide.open-journey.result':
    'Süren bir Journey bugünde açılır; bugün için henüz bir şey yazılmadıysa bugünden önceki son kayıtta açılır. Bitmiş bir Journey başında açılır.',
  'help.guide.open-journey.tip.1': '“Journey Ayarları”ndan bir kapak seçmediyseniz kapak, Journey’in ilk fotoğrafıdır.',
  // continue-writing
  'help.guide.continue-writing.title': 'Süren Journey’e devam edin',
  'help.guide.continue-writing.goal': 'İçinde olduğunuz Journey’in bugünkü sayfasını doğrudan açın.',
  'help.guide.continue-writing.step.1':
    "Üstteki afişte “Yazmaya devam et” seçeneğine tıklayın. Afiş, devam eden Journey'i gösterir; devam eden yoksa en son Journey'i gösterir.",
  'help.guide.continue-writing.result':
    'Günlük bugünün sayfasında açılır. Henüz hiçbir şey yazılmamışsa bugünden önceki son kayıtta açılır.',
  'help.guide.continue-writing.tip.1':
    'Bir seyahat yeni bittiğinde bunun üstünde Seyahat yeni bitti bannerı görünür. Journey Oluştur, o seyahat işaretli olarak bir journey başlatır; Kapat bu öneriyi bu tarayıcıda gizler.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Günlük',
  'help.ctx.journey-detail.summary':
    'Açık bir journey: solda gün gün zaman çizelgesi, sağda plan, kaydettikleriniz, girdiler ve fotoğraflar için açılıp kapanan katmanları olan harita. Başlıkta sayılar, Studio, öneri anahtarı ve Journey Ayarları için ⋯ bulunur. Altındaki araç çubuğuyla girdi ekleyebilirsiniz.',
  'help.ctx.journey-detail.bullet.1':
    'Üst kısım: geri oku ve durum rozeti, kapak, başlık ve alt başlık, gün, yer, girdi ve fotoğraf sayıları; sağda Studio, önerileri gizleyen veya gösteren göz simgesi ve “Journey Ayarları” için ⋯.',
  'help.ctx.journey-detail.bullet.2':
    'Araç çubuğu: “Zaman çizelgesi” ve “Galeri” sekmeleri, “Bu yolculukta ara” ve “Kayıt Ekle”. “Galeri”de “Kayıt Ekle” yerine “Yükle” görünür.',
  'help.ctx.journey-detail.bullet.3':
    "Zaman çizelgesi: her gün için bir bölüm; günün numarası, yer sayısı ve o güne girdi eklemek için bir + var. Altında fotoğraf, ruh hali, hava durumu ve hikâye içeren girdi kartları ile seyahatlerden gelen kesikli çizgili öneri kartları yer alır; her önerinin kapatmak için bir ×'i vardır.",
  'help.ctx.journey-detail.bullet.4':
    "Harita: üstündeki katman çubuğu “Plan” (içi boş iğneler ve seyahatlerin kesikli GPX rotaları), “Kaydedilen” (Dawarich'ten saklanan düz çizgili rotalar), “Kayıtlar” (gün renklerinde iğneler, tarih sırasıyla ince kesikli çizgiyle birleştirilir) ve “Fotoğraf” arasında geçiş yapar. Yanlarındaki (i) tüm simgeleri açıklar.",
  'help.ctx.journey-detail.bullet.5':
    'Journey Ayarları (⋯): kapak, ad ve alt başlık, durum, GPX izleri, Kaydedilen günler, fotoğraflardan yerler, kayıt alanları, reddedilen öneriler, senkronize seyahatler, katkıda bulunanlar ve bir seyahatin hangi üyelerinin erişim alacağı, herkese açık paylaşım, arşivleme ve silme.',
  'help.ctx.journey-detail.bullet.6':
    'Uzun bir zaman çizelgesinin altında Başa dön, herhangi bir güne ya da girdiye atlayan bir gün sayacı ve Son girdiye git bulunur.',
  // add-entry
  'help.guide.add-entry.title': 'Kayıt yazın',
  'help.guide.add-entry.goal': 'Bir günün hikâyesini başlık, metin, ruh hali ve hava durumuyla ekleyin.',
  'help.guide.add-entry.step.1':
    "Araç çubuğunda Kayıt Ekle'ye tıklayın. Belirli bir günden başlamak için o günün başlığının sağ ucundaki + işaretine tıklayın.",
  'help.guide.add-entry.step.2':
    'Kayda bir başlık verin ve metnini yazın. Metnin üstündeki araç çubuğu Markdown ile kalın, italik, başlık, alıntı, bağlantı ve liste ekler.',
  'help.guide.add-entry.step.3':
    'Sağ sütunda tarihi ve saati kontrol et, bir konum ara ya da mevcut konumunu kullan; ruh halini ve havayı seç.',
  'help.guide.add-entry.step.4': '“Kaydet”e tıklayın.',
  'help.guide.add-entry.result':
    'Kayıt, zaman çizelgesinde kendi gününde ve haritada bir iğne olarak görünür. Başlıktaki sayılar güncellenir.',
  'help.guide.add-entry.tip.1': 'Bir öneriye yazarken aynı düzenleyiciyi kullanırsınız, yer de önceden ayarlıdır.',
  'help.guide.add-entry.tip.2':
    "Yeri olan bir girdide “Rotanın dışında bırak” seçeneği vardır: girdi günlükte kalır, ama mesafeye ve ülkelere sayılmaz ve Studio'daki haritada gösterilmez.",
  // entry-photos
  'help.guide.entry-photos.title': 'Bir kayda fotoğraf ve video ekleyin',
  'help.guide.entry-photos.goal': 'Bir güne fotoğraf ekleyin; ilk fotoğraf kaydın kapağı olur.',
  'help.guide.entry-photos.step.1': 'Kaydın kartındaki ⋯ ile menüsünü açın ve “Düzenle”yi seçin.',
  'help.guide.entry-photos.step.2':
    '“Fotoğraf yükle”ye tıklayın ve dosyaları seçin. “Galeriden”, Journey’in galerisinde zaten bulunan resimleri alır; “External photos” o gün için bağlı bir Immich ya da Synology kitaplığında arama yapar.',
  'help.guide.entry-photos.step.3':
    'Kapağı seçmek için bir resmin üzerine gelip “1. yap”a tıklayın, sonra “Kaydet”e tıklayın.',
  'help.guide.entry-photos.result':
    'Fotoğraflar kartta ve galeride görünür. İlk fotoğraf her yerde küçük resim olarak kullanılır.',
  'help.guide.entry-photos.tip.1':
    "Videoları da bir kayda aynı şekilde eklersiniz: 500 MB'a kadar mp4, m4v, webm veya mov. Videolar değiştirilmeden saklanır.",
  'help.guide.entry-photos.tip.2':
    "iPhone'dan gelen HEIC dosyaları yüklenirken JPEG'e dönüştürülür, bu da GPS ve kamera meta verilerini siler.",
  // suggestions
  'help.guide.suggestions.title': 'Önerileri kullanın ya da yok sayın',
  'help.guide.suggestions.goal': 'Seyahatlerinizdeki yerleri kayda dönüştürün, hakkında yazmayacaklarınızı yok sayın.',
  'help.guide.suggestions.step.1':
    'Öneri, kesikli kenarlı ve “Kayıt Ekle” düğmeli bir karttır: bağlı bir seyahatin, planlandığı günde yer alan bir yeridir. Yer ve gün hazır olarak düzenleyiciyi açmak için ona tıkla.',
  'help.guide.suggestions.step.2':
    'Kullanmayacağın bir kartın sağ ucundaki × işaretine tıkla. Kart zaman çizelgesinden kalkar ama silinmez; seyahat eşitlemesi de onu bir daha önermez.',
  'help.guide.suggestions.step.3':
    'Fikrini mi değiştirdin? Başlıktaki ⋯ ile “Journey Ayarları”nı aç: “Yok sayılan önerileri geri getir” kaç öneri olduğunu gösterir ve hepsini geri getirir.',
  'help.guide.suggestions.result':
    'Zaman çizelgesinde yalnızca yazmak istediğiniz kayıtlar kalır. Okurken tüm önerileri tek seferde gizlemek için başlıktaki göz simgesini kullanın.',
  'help.guide.suggestions.tip.1': 'İki güne planlanmış bir yer, o iki günün her birinde bir öneri verir.',
  'help.guide.suggestions.tip.2': 'Öneriler istatistiklere hiçbir zaman sayılmaz; yalnızca yazılmış kayıtlar sayılır.',
  // add-on-day
  'help.guide.add-on-day.title': 'Daha önceki bir güne kayıt ekleyin',
  'help.guide.add-on-day.goal': 'Geçmişteki bir gün hakkında, tarihi sonradan değiştirmeden yazın.',
  'help.guide.add-on-day.step.1': 'O günün başlığının sağ ucundaki + işaretine tıklayın.',
  'help.guide.add-on-day.step.2':
    'Düzenleyici o tarih ayarlı olarak açılır. Her zamanki gibi yazın ve “Kaydet”e tıklayın.',
  'help.guide.add-on-day.result': 'Kayıt hemen doğru güne eklenir.',
  'help.guide.add-on-day.tip.1':
    'Bir gün içindeki sırayı değiştirmek için girdinin üzerine gelin: solunda Yukarı taşı ve Aşağı taşı belirir.',
  // pros-cons
  'help.guide.pros-cons.title': 'Bir değerlendirme ekleyin',
  'help.guide.pros-cons.goal': 'Bir günü neyin harika, neyin kötü olduğuyla özetleyin.',
  'help.guide.pros-cons.step.1':
    'Düzenleyicide hikâyenin altındaki “Artılar ve Eksiler” bölümünü bulun. “Artılar” ya da “Eksiler” alanına bir madde yazın, bir sonraki için “Başka ekle”yi kullanın.',
  'help.guide.pros-cons.step.2':
    "Kaydet'e tıklayın. Kartta Daha fazla göster, hikâyeyi ve hükmü iki kısa liste olarak açar.",
  'help.guide.pros-cons.result':
    'Başparmak yukarı ve aşağı simgeleri hikâyenin altında görünür, böylece bir bakışta görürsünüz.',
  'help.guide.pros-cons.tip.1':
    "Bir Journey'de değerlendirme kullanmıyorsanız, bu bölümü Journey Ayarları içindeki “Kayıt alanları” bölümünden kapatabilirsiniz.",
  // search-journey
  'help.guide.search-journey.title': 'Uzun bir günlükte bir şey bulun',
  'help.guide.search-journey.goal': 'Haftalarca süren kayıtları kaydırmadan istediğiniz kaydı bulun.',
  'help.guide.search-journey.step.1':
    'Araç çubuğundaki “Bu yolculukta ara” alanına yazın. Zaman çizelgesi yazdıkça başlıklar, hikâyeler, yerler ve etiketler içinde süzülür. Aksan ve büyük küçük harf fark etmez.',
  'help.guide.search-journey.step.2':
    'Bunun yerine bir güne atlamak için zaman çizelgesinin altında, “Başa dön” ile “Son girdiye git” arasındaki gün sayısına tıkla.',
  'help.guide.search-journey.result':
    'Zaman çizelgesi seçtiğin güne veya girdiye kayar ve harita da oraya gider. Arama kutusunu temizleyene kadar yalnızca eşleşen girdiler gösterilir.',
  'help.guide.search-journey.tip.1':
    'Süren bir Journey bugünün sayfasında açılır; bu yüzden geçerli sayfa genellikle zaten görünürdür.',
  'help.guide.search-journey.tip.2':
    'Başlıktaki göz önerileri gizler, böylece yalnızca kendi yazdığın girdileri görürsün.',
  // gallery-map
  'help.guide.gallery-map.title': 'Galeriye ve haritaya göz atın',
  'help.guide.gallery-map.goal': "Journey'in tamamını resimler halinde ve haritada yerler olarak görün.",
  'help.guide.gallery-map.step.1':
    'Araç çubuğunda “Galeri”ye geçin. Galeri, tüm kayıtların her fotoğrafını ve doğrudan galeriye yüklenen resimleri gösterir. Büyütmek için birine tıklayın.',
  'help.guide.gallery-map.step.2':
    'Sağdaki Yükle, galeriye resim ekler. Immich ya da Synology bağlıysa, kütüphanenin adını taşıyan bir düğmeyle resimleri oradan seçebilirsiniz.',
  'help.guide.gallery-map.result':
    'İğneler gün renklerini taşır ve tarih sırasına göre ince kesikli bir çizgiyle birleşir. Haritanın üstündeki katman çubuğu nelerin çizileceğini değiştirir.',
  'help.guide.gallery-map.tip.1':
    "Bir seyahatin GPX izleri haritanın Plan katmanında kesikli çizgiyle gösterilir. Journey Ayarları'ndaki Tüm gezi GPX izlerini göster bunları kapatır.",
  'help.guide.gallery-map.tip.2':
    'Hem Galeri hem Harita paylaşıldığında, konumu olan galeri fotoğrafları herkese açık haritada da görünür.',
  // entry-fields
  'help.guide.entry-fields.title': 'Kayıt alanlarını kapatın',
  'help.guide.entry-fields.goal': 'Düzenleyicide yalnızca bu Journey’in kullandığı alanları gösterin.',
  'help.guide.entry-fields.step.1': "Journey Ayarları'nı açmak için başlığın sağ üstündeki ⋯ simgesine tıklayın.",
  'help.guide.entry-fields.step.2':
    '“Kayıt alanları” altında “Ruh hali”, “Hava durumu” ya da “Artılar ve eksiler”i kapatın.',
  'help.guide.entry-fields.result':
    'Düzenleyici bu alanları artık göstermez. Yazdığınız hiçbir şey kaybolmaz: bir alanı yeniden açtığınızda kayıtlı değerler tekrar görünür. Paylaşılan bir Journey de aynı alanları gizler.',
  'help.guide.entry-fields.tip.1':
    'Anahtarlar Journey başınadır; bu yüzden bir iş seyahati ile bir tatil farklı olabilir.',
  // link-trip
  'help.guide.link-trip.title': 'Başka bir seyahati bağlayın',
  'help.guide.link-trip.goal': 'İkinci bir seyahatin yerlerini günlüğe öneri olarak ekleyin.',
  'help.guide.link-trip.step.1': 'Başlığın sağ üstündeki ⋯ simgesine tıklayıp “Journey Ayarları”nı aç.',
  'help.guide.link-trip.step.2': '“Senkronize Seyahatler” altında “Seyahat Ekle”ye tıkla.',
  'help.guide.link-trip.step.3': 'Seyahati ada veya varış yerine göre ara ve yanındaki “Bağla”ya tıkla.',
  'help.guide.link-trip.result':
    'Seyahatin yerleri zaman çizelgesinde günlerine öneri olarak eklenir ve GPX izleriyle birlikte haritanın Plan katmanına katılır.',
  'help.guide.link-trip.tip.1':
    'Bağlı bir seyahatin yanındaki çöp kutusu, onay istedikten sonra bağlantıyı kaldırır. Yazdığın girdiler silinmez.',
  'help.guide.link-trip.tip.2':
    'Gün sayısına dahil olan kayıtlar, o günü kaç seyahat kapsarsa kapsasın yalnızca bir kez sayılır.',
  // share-public
  'help.guide.share-public.title': "Journey'i herkese açık paylaşın",
  'help.guide.share-public.goal': 'TREK hesabı olmayanlara salt okunur bir bağlantı verin.',
  'help.guide.share-public.step.1':
    'Başlıktaki ⋯ ile “Journey Ayarları”nı aç ve “Herkese açık paylaşım”a kadar kaydır.',
  'help.guide.share-public.step.2': '“Paylaşım bağlantısı oluştur”a tıklayın.',
  'help.guide.share-public.step.3':
    'Ziyaretçilerin neleri göreceğini seç: “Zaman çizelgesi”, “Galeri” ve “Harita”. “Harita” altında “Gezi planı” planlanan yerleri ve rotaları, “Kaydedilen rotalar” ise kaydettiğin günlerin rotalarını ekler. “Kopyala” bağlantıyı panoya kopyalar.',
  'help.guide.share-public.result':
    'Bağlantıya sahip herkes yalnızca açık bölümleri görür, başka bir şey görmez. “Kayıt alanları”nda kapattığınız alanlar orada da gizli kalır.',
  'help.guide.share-public.tip.1':
    'Fotoğraflar herkese açık haritada yalnızca “Galeri” ve “Harita” birlikte açıkken görünür. “Harita” kapalıyken sunucu, fotoğrafları göndermeden önce koordinatlarını siler.',
  'help.guide.share-public.tip.2': 'Paylaşımı durdurmak için “Kopyala”nın yanındaki “Bağlantıyı sil”e tıkla.',
  // contributors
  'help.guide.contributors.title': 'Birlikte yazın',
  'help.guide.contributors.goal': 'Başka bir yolcunun kendi kayıtlarını ve fotoğraflarını eklemesine izin verin.',
  'help.guide.contributors.step.1': "Başlıktaki ⋯ ile Journey Ayarları'nı açın ve Katkıda bulunanlar bölümünü bulun.",
  'help.guide.contributors.step.2':
    '“Katkıda bulunan davet et”e tıklayın ve kullanıcıyı ada ya da e-postaya göre arayın.',
  'help.guide.contributors.step.3': "Görüntüleyici ya da Editör'ü seçip Davet et'e tıklayın.",
  'help.guide.contributors.result':
    'Journey onların listesinde görünür ve kayıtlarında adları yazar. Bir katkıda bulunanı kaldırmak için yanındaki ×’e tıklayın.',
  'help.guide.contributors.tip.1':
    'Katkıda bulunanlar, bu TREK’i kullanan kişiler içindir. Diğer herkes için herkese açık bağlantı var.',
  // studio
  'help.guide.studio.title': 'Journey’i fotoğraf kitabı olarak düzenleyin',
  'help.guide.studio.goal': 'Günlüğü yazdırılabilir sayfalara dönüştürün.',
  'help.guide.studio.step.1': "Üst çubukta “Studio” seçeneğine tıklayın. Tasarımcı, Journey'in üzerinde açılır.",
  'help.guide.studio.step.2':
    'Geri dönmek için üst çubuğun sağ ucundaki × simgesine tıklayın. Kaldığınız yere dönersiniz.',
  'help.guide.studio.result':
    'Şerit ve panelleri solda, çift sayfa çalışma alanında, özellikler sağdadır. Otomatik yerleşim kitabı kayıtlarınızdan oluşturur. Dışa aktar, baskıya hazır bir PDF oluşturur.',
  'help.guide.studio.tip.1': 'Studio için pencerenin en az 1024 px genişliğinde olması gerekir ve telefonda sunulmaz.',
  'help.guide.studio.tip.2':
    'Kitap, Journey ile aynı erişime sahiptir: Journey’i okuyabilen herkes kitabı açabilir, Journey’i düzenleyebilen herkes kitabı kaydedebilir.',
  // archive-journey
  'help.guide.archive-journey.title': 'Bir Journey’i arşivleyin ya da silin',
  'help.guide.archive-journey.goal': 'Bitmiş bir Journey’i kapatın ya da kalıcı olarak silin.',
  'help.guide.archive-journey.step.1': "Journey Ayarları'nı açmak için başlığın sağ üstündeki ⋯ simgesine tıklayın.",
  'help.guide.archive-journey.step.2':
    "En altta “Journey'i Arşivle” Journey'i bitirir ve arşivlenmiş olarak işaretler, “Journey'i geri aç” onu geri getirir. “Sil”, onaydan sonra Journey'i tüm kayıtları ve fotoğraflarıyla birlikte kaldırır.",
  'help.guide.archive-journey.result':
    'Arşivlenmiş bir Journey okunabilir ve paylaşılabilir kalır; yalnızca artık bugünün tarihinde açılmaz.',
  'help.guide.archive-journey.tip.1': "Silme geri alınamaz ve Journey'in bağlı olduğu seyahatleri değiştirmez.",
  'help.guide.archive-journey.tip.2': 'Kapak, ad ve alt başlık aynı pencerede, en üsttedir.',
  'help.guide.journey-status.title': 'Bir Journey’in durumunu ayarlayın',
  'help.guide.journey-status.goal':
    'Bir Journey’i, seyahatlerinin tarihlerine bırakmak yerine kendiniz taslak, canlı ya da tamamlandı olarak işaretleyin.',
  'help.guide.journey-status.step.1':
    "Journey Ayarları'nı açmak için journey başlığının sağ üstündeki ⋯ simgesine tıklayın.",
  'help.guide.journey-status.step.2':
    '“Durum” altında “Taslak”, “Canlı” ya da “Tamamlandı”yı seçin. Seçim hemen kaydedilir.',
  'help.guide.journey-status.result':
    'Journey seçtiğiniz durumu korur: Taslak ve Tamamlandı, kartında ve başlığında rozet olarak görünür; Canlı bir journey ise journey listesinin üstündeki bannerda gösterilir.',
  'help.guide.journey-status.tip.1':
    '“Otomatik”, bağlı seyahatlerin tarihlerini yeniden kullanır. Bağlı seyahati olmayan otomatik bir Journey taslak olarak kalır.',
  'help.guide.journey-status.tip.2':
    'Elle ayarladığınız durum, siz değiştirene kadar kalır, seyahat tarihleri değişse bile.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio, bir yolculuğu basabileceğiniz bir fotoğraf kitabı olarak düzenler. Günlüğün üzerinde açılır: şerit ve panelleri solda, üzerinde çalıştığınız çift sayfa ortada, özellikleri sağdadır. Otomatik yerleşim kayıtlarınızdan ilk taslağı oluşturur, bir tema kitaba renklerini ve yazı tiplerini verir, asistan da sizinle birlikte sayfa tasarlayabilir. Sonrasında her şeyi taşıyabilir, kırpabilir ve yeniden biçimlendirebilirsiniz; her adım geri alınabilir.',
  'help.ctx.journey-studio.bullet.1':
    'Üst çubuk: solda yolculuğun kapağı ve adı. Sağda kitapta başka kimlerin olduğu ve kitabın kaydedilip kaydedilmediği, sayfa biçimi, geri al, yinele ve yapıştır, Otomatik yerleşim, asistan, yardım, Dışa aktar ve Studio’yu kapatan düğme.',
  'help.ctx.journey-studio.bullet.2':
    'Soldaki şerit: Sayfalar, İçerik (yolculuğun fotoğrafları ve kayıtları), Düzenler, Öğeler (metin, şekiller, çizgiler, çerçeveler, simgeler ve çıkartmalar), Seyahat (yolculuktan oluşturulan rakamlar, haritalar, ülkeler ve işaretler) ve bunların altında ayrı olarak Tema ile Katmanlar.',
  'help.ctx.journey-studio.bullet.3':
    'Çalışma alanı: taşma payı ve güvenli kenar boşluklarıyla geçerli çift sayfa ve altında Görünüme sığdır, Kitap görünümü ve Bu çift sayfayı indir düğmelerinin bulunduğu yakınlaştırma çubuğu.',
  'help.ctx.journey-studio.bullet.4':
    'Sağdaki Özellikler: seçili öğeyle ilgili her şey; konumdan, boyuttan ve kırpmadan renklere, efektlere, katman sırasına ve kilide kadar. Hiçbir şey seçili değilken sayfa arka planını, temayı, sayfa numaralarını ve belgeyi gösterir.',
  'help.ctx.journey-studio.bullet.5':
    'Kitap basılı bir kitap gibi düzenlenir: kapak, kapağın boş iç yüzünün karşısında tek bir ilk sayfa, çift sayfalar, tek bir son sayfa ve arka kapak. Sayfa numaraları ilk sayfadan başlar ve gösterildiği gibi basılır.',
  'help.ctx.journey-studio.bullet.6':
    'Birden çok kişi aynı anda tasarım yapabilir: herkes diğerlerinin imleçlerini adlarıyla görür. Başkasının değiştirdiği bir sürümü kaydederseniz TREK onun çalışmasının üzerine yazmaz, bir çakışma gösterir.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: tüm kitap için tek bir görünüm; kâğıdı, mürekkebi ve üç vurgusu, yazı tipleri ve motifleri. Temaya bağlı öğeler, temayı değiştirdiğinizde onu izler.',
  'help.ctx.journey-studio.bullet.8':
    'Asistan: bir yönetici yapay zekâyı ayarladıysa, üst çubuktaki konuşma balonu sizinle birlikte sayfaları düzenleyen, alt yazılar yazan ve kitabı yeniden biçimlendiren bir asistan açar. Yaptığı her değişiklik bir geri alma adımıdır.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Kitabı otomatik oluşturun',
  'help.guide.studio-auto-layout.goal':
    'Günlüğün kayıtlarından ve fotoğraflarından tek tıkla eksiksiz bir ilk taslak alın.',
  'help.guide.studio-auto-layout.step.1': 'Üst çubukta “Auto layout” seçeneğine tıklayın.',
  'help.guide.studio-auto-layout.step.2':
    '“Tüm kitap” seçeneğini seçin: tüm sayfaları değiştirir, başlığınızı ve sayfa ayarlarınızı korur. “Bu sayfa” yalnızca ekrandaki çift sayfayı yeniden oluşturur ve sadece bir kayıttan oluşturulmuş çift sayfalarda sunulur.',
  'help.guide.studio-auto-layout.step.3':
    'Sayfa şeridine göz atın. Önceki sürümü daha çok beğendiyseniz “Geri al” düzenin tamamını geri alır.',
  'help.guide.studio-auto-layout.result':
    'Her kayıt için sırayla bir çift sayfa oluşur; fotoğrafları, başlığı ve metni sizin için yerleştirilir. Her öğe, siz düzenleyene kadar kaydına bağlı kalır ve onunla birlikte güncellenir.',
  'help.guide.studio-auto-layout.tip.1':
    'İki seçenek de normal geri alma adımlarıdır, bu yüzden rahatça deneyip geri alabilirsiniz.',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout bir öğeyi bir kayda bağladığında, o kaydı düzenlediğinizde öğe de güncellenir. Öğeyi “Properties”te değiştirirseniz bağlantı kalkar.',
  // studio-pages
  'help.guide.studio-pages.title': 'Çift sayfa ekleyin, taşıyın ve kaldırın',
  'help.guide.studio-pages.goal': 'Kitabı sayfa sayfa düzenleyin.',
  'help.guide.studio-pages.step.1':
    'Şeritte Sayfalar bölümünü açın. Küçük resimler kitabı sırasıyla gösterir: kapak, ilk sayfa, çift sayfalar, son sayfa ve arka kapak. İlk ve son sayfa, ciltli kitabın açıldığı gibi kapaklarının boş iç yüzünün yanında çizilir.',
  'help.guide.studio-pages.step.2':
    'Alttaki “Sayfa ekle”, son sayfadan önce yeni bir çift sayfa ekler. İki küçük resim arasındaki + ise tam o konuma bir tane ekler.',
  'help.guide.studio-pages.step.3':
    'Bir küçük resmin üzerine gelince işlemleri görürsünüz: Öne al, Arkaya al, Sayfayı çoğalt ve Sayfayı sil. O çift sayfayı çalışma alanında açmak için küçük resme tıklayın.',
  'help.guide.studio-pages.result':
    'Kapak, ilk ve son sayfalar ile arka kapak yerinde kalır. Yeni çift sayfalar her zaman bunların arasına eklenir.',
  'help.guide.studio-pages.tip.1':
    'Üst çubuktaki “Book view” kitabın tamamını, ciltleneceği şekliyle yapraklar halinde gösterir.',
  'help.guide.studio-pages.tip.2':
    'Sayfa numaraları, hiçbir şey seçili değilken “Properties” içindeki “Document” altından açılır.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Bir çift sayfaya yerleşim uygulayın',
  'help.guide.studio-layouts.goal': 'Bir çift sayfaya hazır bir fotoğraf ve metin çerçevesi düzeni uygulayın.',
  'help.guide.studio-layouts.step.1':
    'Şeritte Düzenler bölümünü açın. Önce tasarlanmış sayfalar gelir: kitabın temasında hazırlanmış kapaklar ve çift sayfalar; stil düğmeleri bunları tek bir görünüme daraltır. Yerleşimlerim ve Hazır, aynı ızgarada bunların altında yer alır.',
  'help.guide.studio-layouts.step.2':
    'Birine tıklayın. Çalışma alanındaki çift sayfa bu düzenin çerçevelerini alır; mevcut fotoğraflarınız ve metinleriniz bu çerçevelere yerleştirilir.',
  'help.guide.studio-layouts.result':
    'Boş çerçeveler içerik için yer tutucudur: “Content”ten bir fotoğrafı üzerine sürükleyin ya da “Add to this page”i kullanın.',
  'help.guide.studio-my-layouts.title': 'Bir sayfayı kendi yerleşiminiz olarak kaydedin',
  'help.guide.studio-my-layouts.goal': 'Kitabın başka sayfalarında oluşturduğunuz bir düzeni yeniden kullanın.',
  'help.guide.studio-my-layouts.step.1':
    'Bir sayfayı beğendiğiniz gibi düzenleyin, sonra şeritte Düzenler bölümünü açın.',
  'help.guide.studio-my-layouts.step.2':
    'Yerleşimlerim altındaki Bu sayfayı yerleşim olarak kaydet seçeneğine tıklayın. Sayfa listede bir kart olarak görünür.',
  'help.guide.studio-my-layouts.tip.1':
    'Başka bir sayfada yerleşiminize tıklayın; o sayfa da kendi fotoğrafları ve metinleriyle aynı şekilde düzenlenir.',
  'help.guide.studio-my-layouts.result':
    'Yerleşimleriniz kitapla birlikte kaydedilir ve aynı türden sayfalarda sunulur: kapak yerleşimi kapaklarda, çift sayfa yerleşimi çift sayfalarda.',
  'help.guide.studio-layouts.tip.1': 'Bir düzen de diğerleri gibi bir geri alma adımıdır.',
  // studio-content
  'help.guide.studio-content.title': 'Sayfaya fotoğraf ve kayıt koyun',
  'help.guide.studio-content.goal': "Journey'in kendi fotoğraflarını ve kayıtlarını çift sayfaya ekleyin.",
  'help.guide.studio-content.step.1':
    "Kenar çubuğunda Content bölümünü açın. “Fotoğraflar”, Journey'deki tüm resimleri listeler. “Kayıtlar”, kayıtları metinleriyle listeler.",
  'help.guide.studio-content.step.2':
    "Bir fotoğrafı sayfaya ya da boş bir çerçeveye sürükle veya altındaki “Bu sayfaya ekle”ye tıkla. “Fotoğraf yükle” journey'de henüz olmayan resimleri ekler; “Immich'ten” ve “Synology'den” ise bağlı bir kütüphaneden seçmeni sağlar.",
  'help.guide.studio-content.step.3':
    'Bir kaydın altında “Başlık”, Story ve “Yer”, o metni sayfaya metin öğesi olarak koyar. Tarih ve koordinatlar işaret olarak eklenir, kaydın fotoğrafları da orada listelenir.',
  'help.guide.studio-content.result':
    'Bıraktığınız fotoğraf bir fotoğraf öğesi olur. Metin, siz düzenleyene kadar kayda bağlı kalır.',
  'help.guide.studio-theme.title': 'Kitaba bir tema verin',
  'help.guide.studio-theme.goal': 'Tüm kitabın renklerini ve yazı tiplerini tek seferde belirleyin.',
  'help.guide.studio-theme.step.1':
    'Şeritte Tema bölümünü açın. Her kart bir temayı küçük bir sayfa olarak gösterir: kâğıdını, yazı tipini ve üç vurgu rengini.',
  'help.guide.studio-theme.step.2':
    'Denemek için bir temaya tıklayın. Kartların altında paletini değiştirebilir, başka yazı tipleri seçebilir, motifleri ve süslemeyi belirleyebilirsiniz.',
  'help.guide.studio-theme.step.3':
    'Kitaba uygula seçeneğine tıklayın; ekrandaki çift sayfa için ise Bu sayfaya uygula seçeneğine.',
  'help.guide.studio-theme.tip.1':
    'Temaya bağlı öğeler temanın renklerini ve yazı tiplerini alır ve temayı değiştirdiğinizde onu izler. Henüz bağlı olmayanları da yeniden biçimlendir, önce geri kalanları bağlar.',
  'help.guide.studio-theme.tip.2': 'Fotoğraflardan renkler, yolculuğun görsellerinden bir palet oluşturur.',
  'help.guide.studio-theme.result':
    'Kitaptaki bağlı tüm renkler ve yazı tipleri aynı anda değişir; temayı uygulamak tek bir geri alma adımıdır.',
  'help.guide.studio-content.tip.1': '“Content” bölümünün üstündeki arama kutusu her iki listeyi de filtreler.',
  'help.guide.studio-content.tip.2':
    'Masaüstünüzden çalışma alanına bir dosya bıraktığınızda TREK onu yükler ve tek adımda yerleştirir.',
  // studio-elements
  'help.guide.studio-elements.title': 'Metin, şekil, simge ve çıkartma ekleyin',
  'help.guide.studio-elements.goal': 'Fotoğraf ve hikâyelerin yanı sıra çift sayfayı süsleyen öğeler ekleyin.',
  'help.guide.studio-elements.step.1':
    'Şeritte Öğeler bölümünü açın. Eklenebilecekleri altı sekme ayırır: Metin, Şekiller, Çizgiler, Çerçeve, Simgeler ve Çıkartmalar.',
  'help.guide.studio-elements.step.2':
    'Bir metin stiline ya da tasarlanmış bir başlığa, bir şekle, bir çizgiye, boş bir çerçeveye, bir simgeye veya bir çıkartmaya tıklayın. Her biri çift sayfanın ortasına yerleştirilir ve sonra taşıyabilirsiniz.',
  'help.guide.studio-elements.result':
    'Yazmak için bir metin öğesine çift tıklayın; yazı tipi, kalınlık, boyut, aralık ve hizalama “Properties”tedir.',
  'help.guide.studio-stickers.title': 'Çıkartmalarla süsleyin',
  'help.guide.studio-stickers.goal': 'Simge yapılardan ve yemeklerden hayvanlara ve oklara kadar çizimler ekleyin.',
  'help.guide.studio-stickers.step.1': 'Şeritte Öğeler bölümünü açın ve Çıkartmalar sekmesini seçin.',
  'help.guide.studio-stickers.step.2':
    'Bir sözcük arayın veya raflara göz atın, sonra çıkartmayı çift sayfaya yerleştirmek için tıklayın.',
  'help.guide.studio-stickers.tip.1':
    'Bir çıkartma seçiliyken Özellikler, parçalarının rengini değiştirir ve çıkartmayı aynalar.',
  'help.guide.studio-stickers.result': 'Çıkartma bir çizimdir, bu yüzden her boyutta keskin kalır.',
  'help.guide.studio-elements.tip.1': 'Çerçeveler boş fotoğraf alanlarıdır: resmi sonradan bırakabilirsiniz.',
  // studio-travel
  'help.guide.studio-travel.title': 'Harita, rakam, ülke ve işaret ekleyin',
  'help.guide.studio-travel.goal': 'Yolculuğun kendisini sayfada tasarlanmış öğelere dönüştürün.',
  'help.guide.studio-travel.step.1':
    'Şeritte Seyahat bölümünü açın. Eklenebilecekleri dört sekme ayırır: Rakamlar, Haritalar, Ülkeler ve İşaretler.',
  'help.guide.studio-travel.step.2':
    'Her kart öğeyi yolculuğunuzun kendi rakamlarıyla, temanın renklerinde gösterir: bir özet afiş, bilet, yol levhası ya da kilometre sayacı olarak, numaralı duraklı ya da bir ülkeye göre kesilmiş bir harita, damga, kartpostal ya da iğne olarak bir ülke, damga, etiket ya da kurdele olarak bir tarih veya mesafe.',
  'help.guide.studio-travel.step.3':
    'Bir karta tıklayın. Öğe çift sayfanın ortasına yerleştirilir ve sonra taşıyıp boyutlandırabilirsiniz.',
  'help.guide.studio-travel.result':
    'Öğe çift sayfada görünür. Özellikler görünümünü değiştirir; yolculuk değiştiğinde her rakam, harita ve ülke güncellenir.',
  'help.guide.studio-text-effects.title': 'Metne efekt ekleyin',
  'help.guide.studio-text-effects.goal': 'Bir başlığa kontur, gölge, kavis ya da desenle doldurulmuş harfler verin.',
  'help.guide.studio-text-effects.step.1': 'Seçmek için sayfadaki bir metin öğesine tıklayın.',
  'help.guide.studio-text-effects.step.2':
    'Özellikler’de Efektler bölümünü açarak kontur, gölge ya da vurgu ekleyin veya harfleri bir geçişle ya da desenle doldurun. Harf biçimi ve konum satırı kavisler ve kutusuna sığdırır.',
  'help.guide.studio-text-effects.tip.1':
    'Çerçeveye sığdır, metni kutusuna sığana kadar küçültür; böylece uzun bir başlık asla taşmaz.',
  'help.guide.studio-text-effects.result': 'Efekt metinle birlikte çizilir; baskıda ekrandakiyle aynı görünür.',
  'help.guide.studio-background.title': 'Sayfa arka planını değiştirin',
  'help.guide.studio-background.goal':
    'Sayfayı bir renk, bir geçiş ya da bir desenle boyayın veya altına bir fotoğraf koyun.',
  'help.guide.studio-background.step.1':
    'Hiçbir şey seçili kalmasın diye sayfanın boş bir yerine tıklayın. Sayfa arka planı Özellikler’in en üstündedir.',
  'help.guide.studio-background.step.2':
    'Kâğıt, Düz, Geçiş ya da Desen seçeneğini ve bir renk seçin veya Arka plan olarak fotoğraf altındaki bir fotoğrafa tıklayın.',
  'help.guide.studio-background.tip.1': 'Tüm sayfalara uygula, kitabın her sayfasına aynı arka planı verir.',
  'help.guide.studio-background.result':
    'Arka plan taşma payına kadar uzanır, bu yüzden baskıda sayfanın kenarına kadar basılır.',
  'help.guide.studio-layers.title': 'Katmanlarla düzenleyin, gizleyin ve kilitleyin',
  'help.guide.studio-layers.goal': 'Çift sayfadaki her şeyi üst üste sıralanma düzeninde görün ve orada düzenleyin.',
  'help.guide.studio-layers.step.1': 'Şeritte Katmanlar bölümünü açın. Listenin üstü sayfanın ön tarafıdır.',
  'help.guide.studio-layers.step.2':
    'Sırayı değiştirmek için bir satırı sürükleyin, bir öğeyi gizlemek için göz simgesini, yerinde sabit tutmak için kilidi kullanın. Birkaçını seçip birlikte taşımak için gruplayın.',
  'help.guide.studio-layers.tip.1': 'Öğeye kendi adını vermek için satıra çift tıklayın.',
  'help.guide.studio-layers.tip.2': 'Gizlenen öğeler PDF’e dahil edilmez.',
  'help.guide.studio-layers.result':
    'Kalabalık sayfaları düzenlemek kolay kalır, bitmiş kısımlar da yanlışlıkla taşınamaz.',
  'help.guide.studio-travel.tip.1':
    'Haritalar altında Duraklar, rotanın her durağını listeler. Örneğin kalkış havalimanınız gibi bir durağı haritaların ve rakamların dışında bırakmak için kapatın.',
  'help.guide.studio-travel.tip.2':
    'Bir ülke haritası yalnızca o ülkenin duraklarını gösterir; böylece yolculuk uzun bir uçuşla başlasa bile ülke sayfayı doldurur.',
  // studio-properties
  'help.guide.studio-properties.title': 'Seçtiğinizi düzenleyin',
  'help.guide.studio-properties.goal':
    'Denetçi paneliyle bir öğeyi taşıyın, kırpın, biçimlendirin ve katmanlarını sıralayın.',
  'help.guide.studio-properties.step.1':
    'Çift sayfada bir öğeye tıklayın. Boyut ve döndürme için tutamaçlar belirir; taşımak için öğeyi sürükleyin.',
  'help.guide.studio-properties.step.2':
    'Sağdaki “Properties” paneli, seçili öğenin ayarlarını gösterir: konum ve boyut, çerçevede nelerin kalacağını belirleyen odak noktasıyla “Crop”, Fill veya Fit, “Look” filtreleri, “Corner radius”, “Frame style”, katman sırası ve “Lock”.',
  'help.guide.studio-properties.step.3':
    '“Çoğalt” ve “Sil” denetçinin üstündedir. Üst çubuktaki “Geri al” bu değişikliklerin hepsini geri alır.',
  'help.guide.studio-properties.result':
    'Kilitli bir öğeyi sayfada seçemez ya da taşıyamazsınız. Bu, diğer öğeler üzerinde çalışırken bitmiş bir düzeni korur.',
  'help.guide.studio-properties.tip.1':
    'Shift ile tıklamak birden fazla öğe seçer. Denetçi bu durumda hepsini birlikte düzenler.',
  'help.guide.studio-properties.tip.2':
    'Otomatik düzenin yerleştirdiği bir öğeyi düzenlerseniz artık kayıtla bağlantılı olmaz ve o kayıtta sonradan yapılan değişiklikleri izlemez.',
  // studio-format
  'help.guide.studio-format.title': 'Sayfa biçimini seçin',
  'help.guide.studio-format.goal': 'Düzeni oluşturmadan önce kitabın baskı boyutunu ayarlayın.',
  'help.guide.studio-format.step.1':
    'Üst çubukta düzenleme araçlarının yanındaki sayfa biçimine tıklayın. Biçimin adını ve şeklini gösterir.',
  'help.guide.studio-format.step.2':
    'Square 21 × 21 cm, Square 30 × 30 cm, A4 veya A5 yatay ya da dikey seçin, ya da milimetre cinsinden özel bir genişlik ve yükseklik girin. “Taşma” ve güvenli kenar boşluğu bunların altındadır.',
  'help.guide.studio-format.result':
    'Her çift sayfa bu boyutta çizilir; varsayılan olarak 3 mm taşma payı ve 5 mm güvenli kenar boşluğu vardır.',
  'help.guide.studio-format.tip.1':
    'Önce biçimi değiştirin, sonra Auto layout çalıştırın. Auto layout, çalıştığı anda ayarlı olan biçimi kullanır.',
  'help.guide.studio-format.tip.2': 'Matbaanızdan taşma payı ve güvenli alan değerlerini isteyin ve onları girin.',
  // studio-export
  'help.guide.studio-export.title': 'Kitabı PDF olarak dışa aktarın',
  'help.guide.studio-export.goal': 'Baskıya hazır bir dosya ya da ekranda okumak için bir dosya alın.',
  'help.guide.studio-export.step.1': 'Üst çubukta “Export” seçeneğine tıklayın.',
  'help.guide.studio-export.step.2':
    'Matbaanın istediği biçim olan, okuma sırasıyla yaprak başına bir sayfa için “Tek sayfa” seçeneğini ya da kitabın açıldığı gibi her seferinde iki sayfa için “Çift sayfa” seçeneğini seçin. “Kesim işaretleri” her kenara taşma payını ekler ve nereden kesileceğini gösterir.',
  'help.guide.studio-export.step.3':
    '“Yazdırma görünümü”ne tıklayın. Tarayıcınız sayfaları açar. Dosyayı oluşturmak için “PDF olarak Kaydet” seçeneğini seçin.',
  'help.guide.studio-export.result':
    'İletişim kutusunda belirtilen sayıda yaprak içeren, ayarladığınız sayfa biçiminde bir PDF.',
  'help.guide.studio-export.tip.1': 'PDF’yi yalnızca masaüstünde oluşturabilirsiniz; Studio da böyledir.',
  'help.guide.studio-export.tip.2':
    'Deneme baskısı için “Çift sayfa” seçeneğini kesim işaretleri olmadan, matbaa için “Tek sayfa” seçeneğini kesim işaretleriyle dışa aktarın.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Bir çift sayfayı başka bir kitapta yeniden kullanın',
  'help.guide.studio-spread-file.goal': "Beğendiğiniz bir tasarımı bir Journey'in kitabından diğerine kopyalayın.",
  'help.guide.studio-spread-file.step.1':
    'Çift sayfa çalışma alanındayken yakınlaştırma çubuğunun sağ ucundaki “Bu çift sayfayı indir” düğmesine tıklayın. Dosya tasarımı içerir, fotoğrafları içermez.',
  'help.guide.studio-spread-file.step.2':
    'Diğer kitapta Pages bölümünü açın, “Sayfa ekle” yanındaki “İçe aktar”a tıklayın ve dosyayı seçin.',
  'help.guide.studio-spread-file.result':
    'Çift sayfa, çerçeveleri ve metin stilleriyle içe aktarılır. Yeni Journey’in fotoğraflarını çerçevelere bırakın.',
  'help.guide.studio-spread-file.tip.1':
    'Bir dosya çift sayfa tasarımı değilse TREK dosyayı reddeder ve nedenini gösterir.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ayarlar',
  'help.ctx.settings.summary':
    "Kişisel ayarların; soldaki kenar çubuğunda her konu için ayrı bir sekme var. Anahtarların çoğu değiştirdiğin anda geçerli olur. “Kaydet” düğmeli bir form ise ancak “Kaydet”e tıkladığında kaydedilir. Buradaki hiçbir şey TREK'i başkası için değiştirmez.",
  'help.ctx.settings.bullet.1':
    'Soldaki kenar çubuğu: Genel, Görünüm, Harita, Bildirimler, Entegrasyonlar, Çevrimdışı ve Hesap. Eklentiler, bir eklenti etkin olduğunda görünür. Hakkında, operatör gizlemediyse görünür. Sürüm en altta yer alır.',
  'help.ctx.settings.bullet.2':
    "İlk olarak “Genel” açılır. Burada dil, yer adlarının dili, birimler, saat biçimi, hafta başlangıcı ve görüntüleme para birimi ile seyahat haritasının nasıl davranacağı bulunur. “Görünüm” tema, renkler, okunabilirlik, yazı boyutu ve pano widget'larını içerir.",
  'help.ctx.settings.bullet.3':
    "Harita, harita motorunu ve stilini belirler. Bildirimler, hangi olayın hangi kanaldan geleceğini seçtirir. Entegrasyonlar fotoğraf kütüphanelerini, AirTrail'i, Dawarich'i ve wanderer'ı bağlar; API anahtarları ile MCP de buradadır. Çevrimdışı, bu cihazın neleri saklayacağını belirler.",
  'help.ctx.settings.bullet.4':
    '“Hesap”ta profiliniz, şifreniz, iki faktörlü kimlik doğrulama, passkey’ler ve hesabınızı silme seçeneği yer alır.',
  'help.ctx.settings-display.title': 'Görünüm',
  'help.ctx.settings-display.summary':
    "TREK'in nasıl açılacağı, kullandığı dil ve birimler, seyahat haritası ile rezervasyonların davranışı. Her değişiklik anında uygulanır.",
  'help.ctx.settings-display.bullet.1':
    "Başlangıç: Başlangıç sayfası, TREK'i Pano'da ya da Aktif seyahat'te açar. Aktif seyahat seçiliyse Başlangıç sekmesi, o seyahatin hangi sekmeyle açılacağını belirler.",
  'help.ctx.settings-display.bullet.2':
    'Dil ve bölge: Görüntüleme para birimi (para birimi dönüşümü istemiyorsanız Gezi para birimi), Dil, Yer adları, Sıcaklık Birimi, Mesafe Birimi, Saat Biçimi ve Hafta başlangıcı.',
  'help.ctx.settings-display.bullet.3':
    'Seyahat ve harita: “Yerleri şurada aç”, “Gün başlıklarında önce tarih”, “Rezervasyon rota etiketleri”, “Rezervasyon rotalarını her zaman göster”, “Planlanmamış yerler için küçük işaretler”, “Haritada yerleri keşfet”, “Rezervasyon Kodlarını Bulanıklaştır” ve “Rotayı konaklamadan optimize et”.',
  'help.ctx.settings-appearance.title': 'Görünüm',
  'help.ctx.settings-appearance.summary':
    "TREK'in bu hesapta nasıl göründüğü: açık ya da koyu tema, vurgu rengi, cam efekti ve hareket, metin boyutu ve panonun hangi bileşenleri gösterdiği. Her şey anında uygulanır ve oturum açtığınız tüm cihazlarda geçerli olur.",
  'help.ctx.settings-appearance.bullet.1':
    'Tema: “Renk Modu” (Açık, Koyu veya Otomatik), renk şeması ve “Özel” ile açık ve koyu mod için kontrast denetimli kendi vurgu rengin.',
  'help.ctx.settings-appearance.bullet.2':
    '“Deneysel” olarak işaretli okunabilirlik ayarları: Saydamlık, Hareketi azalt, Yoğunluk ve Yazı boyutu; “Her şey” için bir kaydırıcı, “Büyük”, “Orta”, “Normal” ve “Küçük” için de birer kaydırıcı.',
  'help.ctx.settings-appearance.bullet.3':
    "Pano widget'ları: “Masaüstü” (kahramanın altı, sağ kenar çubuğu) ve “Mobil” (kahramanın altı, sayfanın altı) için ayrı anahtarlar.",
  'help.ctx.settings-appearance.bullet.4':
    'Kartların altındaki Varsayılanlara sıfırla, sekmenin tamamını varsayılan değerlerine döndürür.',
  'help.ctx.settings-map.title': 'Harita',
  'help.ctx.settings-map.summary':
    'Seyahat planlayıcının ve günlüğün haritalarını hangi motorun, hangi stilde çizeceği. Leaflet klasik raster haritadır. Mapbox GL, kendi belirtecinizle 3B binalar ve arazi ekler. MapLibre GL ise belirteç gerektirmeden OpenFreeMap vektör karolarını çizer. Atlas her zaman Leaflet kullanır.',
  'help.ctx.settings-map.bullet.1':
    'Harita Sağlayıcısı: Leaflet, Mapbox GL (Deneysel) ya da MapLibre GL; her seçeneğin altında kısa bir açıklama bulunur.',
  'help.ctx.settings-map.bullet.2':
    'Leaflet için Harita Şablonu ve CARTO API anahtarı, iki GL motoru için Harita Stili, Mapbox GL için ayrıca Mapbox Erişim Anahtarı.',
  'help.ctx.settings-map.bullet.3':
    'Yalnızca Mapbox GL: “3D Binalar ve Arazi” ve “Yüksek Kalite Modu”. “Haritayı Kaydet”in üstünde canlı bir önizleme görünür. Seçimini “Haritayı Kaydet” kaydeder.',
  'help.ctx.settings-notifications.title': 'Bildirimler',
  'help.ctx.settings-notifications.summary':
    "TREK'in uygulamanın dışında sana nasıl ulaştığı. En üstte her olay için bir satır ve her kanal için bir sütun olan bir tablo neyin nereye gönderileceğini belirler. Altında web kancası, ntfy, bu cihazdaki anlık bildirim ve eklentilerin kanalları için kartlar yer alır.",
  'help.ctx.settings-notifications.bullet.1':
    'Bildirimler: her olayı kanal başına aç veya kapat. Kilit simgesi, yöneticinin o olayı herkes için kapattığı anlamına gelir.',
  'help.ctx.settings-notifications.bullet.2':
    "“Web kancası URL'si”: Discord, Slack veya özel bir web kancası; “Test et” ve “Kaydet” düğmeleriyle.",
  'help.ctx.settings-notifications.bullet.3':
    "Ntfy: Ntfy Konusu, isteğe bağlı Ntfy Sunucu URL'si ve Erişim Belirteci; Test et ve Kaydet düğmeleriyle.",
  'help.ctx.settings-notifications.bullet.4':
    'Bu cihazda anlık bildirimler: Bu cihaz için aç yalnızca bu tarayıcıyı kapsar, Test gönder bir deneme bildirimi yollar. Bir eklenti kanalı kurulana kadar Yapılandır düğmesi görünür.',
  'help.ctx.settings-integrations.title': 'Entegrasyonlar',
  'help.ctx.settings-integrations.summary':
    "TREK'e dışarıdan bağlanan her şey: günlük için fotoğraf kütüphaneleri, uçuşlar için AirTrail, gerçekte nereye gittiğiniz için Dawarich, patikalar için wanderer, diğer yazılımlar için salt okunur API anahtarları ve yapay zeka istemcileri için MCP. Başka bir hizmete bağlantı, yönetici onu açtıktan sonra görünür.",
  'help.ctx.settings-integrations.bullet.1':
    'Immich ve Synology Photos, AirTrail, Dawarich ve wanderer: her kartta adres ve anahtar alanları, Kaydet, Bağlantıyı test et ve Bağlı ya da Bağlı değil rozeti bulunur.',
  'help.ctx.settings-integrations.bullet.2':
    'API Anahtarları: herkese açık API için salt okunur anahtarlar. Her biri seçtiğin alanlarla sınırlıdır; kopyalayabileceğin “Uç nokta” da burada yer alır.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP Yapılandırması: “MCP Uç Noktası”, “OAuth 2.1 İstemcileri” altında kayıtlı istemcilerin, kopyalayabileceğin “İstemci Yapılandırması” ve “Geri çekmek” düğmeli “Aktif OAuth Oturumları”.',
  'help.ctx.settings-integrations.bullet.4':
    "API Belirteçleri: MCP'ye bağlanmanın eski yolu, “Kullanımdan kalkıyor” olarak işaretli; bunun yerine “OAuth 2.1 İstemcileri”ni kullan.",
  'help.ctx.settings-offline.title': 'Çevrimdışı',
  'help.ctx.settings-offline.summary':
    "Bir seyahatin bağlantı olmadan da açılması için TREK'in bu cihazda sakladıkları ve çevrimdışı yaptığınız bir değişiklik başka yerde yapılan bir değişiklikle çakıştığında olanlar.",
  'help.ctx.settings-offline.bullet.1':
    'Çevrimdışı mod: “Çevrimdışı modu zorla” önce her şeyi indirir, sonra yalnızca önbellekten çalışır ve değişikliklerini kuyruğa alır.',
  'help.ctx.settings-offline.bullet.2':
    'Çevrimdışı için hazırlan: “Çevrimdışı kullanım için indir” seyahat verilerini, belgeleri ve harita karolarını indirir. “Şimdi yeniden senkronize et” elle yeniden senkronize eder.',
  'help.ctx.settings-offline.bullet.3':
    'Çevrimdışı olarak ne saklanacak: “Harita kutucuklarını çevrimdışı sakla” ve seyahat başına bir anahtar. Bitmiş bir seyahat yalnızca sen açarsan saklanır.',
  'help.ctx.settings-offline.bullet.4':
    '“Senkronizasyon çakışmaları” yalnızca iki değişiklik çakıştığında görünür; “Benimki”, “Onlarınkini sakla” ve “Bir çakışma olduğunda” seçenekleriyle birlikte. “Çevrimdışı önbellek” seyahatleri ve bekleyen veya başarısız değişiklikleri sayar; “Yeniden dene”, “Vazgeç” ve “Önbelleği temizle” düğmeleri var.',
  'help.ctx.settings-account.title': 'Hesap',
  'help.ctx.settings-account.summary':
    "Bu TREK'teki hesabınız ve giriş yönteminiz: profil resmi, kullanıcı adı ve e-posta, şifre, iki faktörlü kimlik doğrulama ve passkey'ler. Hesabı sil, Hesap kartının alt kısmındadır.",
  'help.ctx.settings-account.bullet.1':
    'Hesap: resmin üzerindeki kameraya tıklayarak resim yükleyebilir, kırmızı çöp kutusuyla kaldırabilirsiniz. Kullanıcı adı ve E-posta, Profili Kaydet ile kaydedilir.',
  'help.ctx.settings-account.bullet.2':
    "Şifre Değiştir: mevcut şifre, yeni şifre (iki kez; kurallar siz yazdıkça işaretlenir), sonra Şifreyi güncelle. Bu TREK'e yalnızca SSO ile giriş yapılıyorsa bu kart gösterilmez.",
  'help.ctx.settings-account.bullet.3':
    "Kimlik doğrulayıcı uygulaması ve yedek kodlarla İki faktörlü kimlik doğrulama (2FA); şifresiz oturum açmak için Passkey'ler.",
  'help.ctx.settings-account.bullet.4':
    'Hesabı sil, Hesap kartının alt kısmında solda yer alır ve onay ister. Tek yönetici kendini silemez.',
  // language-region
  'help.guide.language-region.title': 'Dil, birim ve para birimini ayarlayın',
  'help.guide.language-region.goal': 'TREK’i kendi dilinizde ve bölgenizin biçimleriyle kullanın.',
  'help.guide.language-region.step.1':
    'Dil ve bölge altında çip satırından bir “Dil” seç. TREK, giriş yaptığın tüm cihazlarda hemen değişir.',
  'help.guide.language-region.step.2':
    '“Yer adları”, yer aramasının, önerilerin ve adreslerin hangi dili kullanacağını belirler; “Uygulamayla aynı” arayüz dilini izler.',
  'help.guide.language-region.result':
    "Tarihler, mesafeler ve paralar beklediğiniz biçimde gösterilir. Maliyetler'de tutarlar yalnızca gösterim için Görüntüleme para biriminizde görünür, girilen tutarlar değişmez.",
  'help.guide.language-region.tip.1': 'Gezi para birimi, her seyahati çeviri yapmadan kendi para biriminde gösterir.',
  'help.guide.language-region.tip.2': "Dil, Tatil'deki ve günlükteki gün ve ay adlarını da belirler.",
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Seyahat haritasını ve gün başlıklarını ayarla',
  'help.guide.travel-map-prefs.goal':
    'Seyahat haritasının neleri göstereceğini ve gün başlıklarının nasıl görüneceğini her seyahat için seç.',
  'help.guide.travel-map-prefs.step.1':
    'Seyahat ve harita bölümünde “Yerleri şurada aç”, yol tarifi düğmesinin doğrudan hangi harita uygulamasını açacağını belirler; “Her seferinde sor” her seferinde uygulamayı seçmene izin verir. “Gün başlıklarında önce tarih” her gün başlığında takvim tarihini önce gösterir.',
  'help.guide.travel-map-prefs.step.2':
    '“Rezervasyon rotalarını her zaman göster” her uçuşu, treni ve diğer rezervasyonları haritada çizer; “Rezervasyon rota etiketleri” her ucuna istasyon veya havalimanı adını yazar. “Planlanmamış yerler için küçük işaretler”, henüz bir güne eklenmemiş yerleri küçültür, böylece planlanan duraklar daha kolay görünür.',
  'help.guide.travel-map-prefs.result':
    'Seyahat haritası, siz yeniden değiştirene kadar her seyahatte bu ayarları kullanır.',
  'help.guide.travel-map-prefs.tip.1':
    'Bu ayarlar seyahate değil, hesaba aittir. Paylaşılan bir seyahatin üyelerinin her biri kendi seçimlerini görür.',
  'help.guide.travel-map-prefs.tip.2':
    'Bir yönetici herkes için varsayılanları belirleyebilir. Burada değiştirdikleriniz yalnızca sizin için geçerlidir.',
  // startup
  'help.guide.startup.title': 'TREK’in neyle açılacağını seçin',
  'help.guide.startup.goal': 'TREK’i her seferinde panoda değil, en çok kullandığınız sayfada açın.',
  'help.guide.startup.step.1':
    "Görünüm sekmesinin en üstünde, Başlangıç bölümünde Başlangıç sayfası'nı Pano ya da Aktif seyahat olarak ayarlayın.",
  'help.guide.startup.step.2':
    'Aktif seyahat seçiliyken Başlangıç sekmesi belirir: o seyahatin hangi sekmeyle açılacağını seçin.',
  'help.guide.startup.result': "TREK'i bir sonraki açışınızda doğrudan bu sayfa açılır.",
  'help.guide.startup.tip.1':
    'Aktif seyahat, bugün süren ya da sıradaki seyahattir. Panelde en üstte gösterilen seyahatle aynıdır.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Temayı ve vurgu rengini ayarlayın',
  'help.guide.theme-scheme.goal': 'TREK’i açık, koyu ya da cihazınıza uyumlu yapın, sevdiğiniz renkte.',
  'help.guide.theme-scheme.step.1':
    "Tema altında Renk Modu'nu Açık, Koyu ya da Otomatik yapın. Otomatik, cihazınızın ayarını izler.",
  'help.guide.theme-scheme.step.2':
    'Bir “Color scheme” seçin: Default, High contrast, Indigo, Teal, Rose, Amber, Violet ya da Custom.',
  'help.guide.theme-scheme.step.3':
    'Özel ile renk noktalarından birini seçin ya da Açık ve Koyu için ayrı ayrı kendi vurgu renginizi belirleyin. Yanlarındaki etiket İyi kontrast ya da Düşük kontrast yazar.',
  'help.guide.theme-scheme.result':
    'Düğmeler, bağlantılar ve vurgular, oturum açtığınız her cihazda her yerde vurgu rengini kullanır.',
  'help.guide.theme-scheme.tip.1': 'Gezinti çubuğunda hızlı açık/koyu anahtarı da vardır ve aynı temayı ayarlar.',
  'help.guide.theme-scheme.tip.2': 'Varsayılan şemayı okumak zor geldiğinde High contrast şemasını seçin.',
  // readability
  'help.guide.readability.title': 'Okunabilirliği ve metin boyutunu ayarlayın',
  'help.guide.readability.goal': 'Cam efektini ve hareketi azaltın, boşluğu ya da yazıyı büyütün.',
  'help.guide.readability.step.1':
    '“Readability” altında “Transparency” cam panelleri düz yüzeylere çevirir, “Reduce motion” animasyonları en aza indirir, “Density” ise “Comfortable” ya da “Compact” seçimini sağlar.',
  'help.guide.readability.step.2':
    'Yazı boyutu: tüm metni tek seferde ölçeklemek için “Her şey”i sürükle ya da “Büyük”, “Orta”, “Normal” ve “Küçük”ü tek tek ayarla. Her boyutun bir örneği görünür, böylece sürüklerken sonucu görürsün.',
  'help.guide.readability.result': 'Değişiklik harita panelleri ve günlük dahil tüm uygulamaya aynı anda uygulanır.',
  'help.guide.readability.tip.1':
    "Cihazın hareketi azaltacak şekilde ayarlıysa TREK'in bazı bölümleri zaten daha az animasyon kullanır. “Hareketi azalt” diğer bölümlerdeki animasyonu azaltır.",
  'help.guide.readability.tip.2':
    'Metin boyutu tipografi kademeleri üzerinden uygulanır; bu yüzden hiçbir şey kesilmez, sığmayan metin alt satıra geçer.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Pano bileşenlerini seçin',
  'help.guide.dashboard-widgets.goal':
    'Yalnızca kullandığınız bileşenleri gösterin, masaüstü ve telefon için ayrı ayrı.',
  'help.guide.dashboard-widgets.step.1':
    "“Pano widget'ları” altında “Masaüstü”, kahramanın altındaki widget'ları ve sağ kenar çubuğunu listeler. Sağ kenar çubuğunu kapatırsan tüm sütun gizlenir ve pano ortalanır; widget'ları, sütunu yeniden açana kadar soluk kalır.",
  'help.guide.dashboard-widgets.step.2':
    'Telefondaki pano için mobilin kendi anahtarları vardır: Kahramanın altında ve Sayfanın altında.',
  'help.guide.dashboard-widgets.result': 'Pano hemen değişir. Sağ kenar çubuğu kapalıysa pano ortalanır.',
  'help.guide.dashboard-widgets.tip.1':
    'Bir eklentinin bileşenleri yalnızca yönetici o eklentiyi açtığı sürece görünür.',
  'help.guide.dashboard-widgets.tip.2':
    'Panonun kendisi ızgara ya da liste görünümünüzü ve sıralama düzeninizi cihaz başına hatırlar.',
  // map-provider
  'help.guide.map-provider.title': 'Harita motorunu ve stilini seçin',
  'help.guide.map-provider.goal': 'Klasik harita, vektör kutucukları ve Mapbox’ın 3B haritası arasında geçiş yapın.',
  'help.guide.map-provider.step.1':
    'Harita Sağlayıcısı altında şunlardan birini seçin: herhangi bir raster karoyla klasik 2B harita için Leaflet, 3B binalar ve arazili vektör karolar için Mapbox GL, belirteç gerektirmeyen OpenFreeMap vektör karoları için MapLibre GL.',
  'help.guide.map-provider.step.2':
    "Leaflet için bir Harita Şablonu, GL motorları için bir Harita Stili seçin ya da kendi URL'nizi yapıştırın. Mapbox GL için bir Mapbox Erişim Anahtarı, CARTO şablonları için bir CARTO API anahtarı gerekir. Her alanın altındaki bağlantı, anahtarı nereden alacağınızı gösterir.",
  'help.guide.map-provider.step.3':
    'Mapbox GL ile “3D Binalar ve Arazi”yi, cihazın yeterince hızlıysa “Yüksek Kalite Modu”nu aç. Önizlemeyi kontrol et, sonra “Haritayı Kaydet”e tıkla.',
  'help.guide.map-provider.result':
    'Seyahat planlayıcı ve günlük haritaları seçtiğin motoru kullanır. Atlas her zaman Leaflet kullanır.',
  'help.guide.map-provider.tip.1': "Belirteç yoksa Mapbox GL boş harita göstermek yerine Leaflet'e geçer.",
  'help.guide.map-provider.tip.2':
    'Çevrimdışı sakladığınız harita karoları, indirdiğiniz sırada etkin olan sağlayıcıdan gelir.',
  // notification-channels
  'help.guide.notification-channels.title': 'Bildirimleri nereden alacağınızı ayarlayın',
  'help.guide.notification-channels.goal':
    'Seyahat hatırlatmalarını ve iş birliği olaylarını telefonunuza ya da başka bir araca alın.',
  'help.guide.notification-channels.step.1':
    "Web kancası için bir Discord, Slack ya da özel Web kancası URL'si yapıştırın, Test et'e tıklayın, sonra Kaydet'e.",
  'help.guide.notification-channels.step.2':
    "ntfy için Ntfy Konusu'nu doldurun. Kendi sunucunuzu çalıştırıyorsanız kendi Ntfy Sunucu URL'nizi ve bir Erişim Belirteci de ekleyin. Test et hemen bir ileti gönderir, Kaydet ayarları saklar.",
  'help.guide.notification-channels.step.3':
    'Üstteki Bildirimler kartında her olayı kanal kanal açın ya da kapatın. Kilit simgesi, yöneticinin bunu herkes için kapattığı anlamına gelir. Kurulmamış bir eklenti kanalında Yapılandır görünür; Test gönder kanalı dener.',
  'help.guide.notification-channels.result':
    'Olaylar, onlar için açtığınız kanallardan gönderilir. Uygulama içi sütunu, gezinme çubuğundaki zil simgesinde nelerin görüneceğini belirler.',
  'help.guide.notification-channels.tip.1':
    'Bir seyahatin kendi “Hatırlatıcı”sı, yani hareketten kaç gün önce hatırlatılacağı, seyahatin düzenleme formunda ayarlanır.',
  'help.guide.notification-channels.tip.2':
    'Yönetici herkes için varsayılan bir ntfy sunucusunu önceden girebilir; konuyu yine kendiniz seçersiniz.',
  // photo-providers
  'help.guide.photo-providers.title': 'Bir fotoğraf kitaplığı bağlayın',
  'help.guide.photo-providers.goal': 'Günlük, günün fotoğraflarını Immich ya da Synology Photos’tan yüklesin.',
  'help.guide.photo-providers.step.1':
    "“Entegrasyon” altında Immich veya Synology Photos kartını bul ve istenenleri gir: Immich için “API Anahtarı” ile “Sunucu URL'si”, Synology Photos için “Kullanıcı adı” ve “Şifre”. Immich, journey fotoğraflarını yüklediğinde onları Immich kütüphanesine de kopyalayabilir.",
  'help.guide.photo-providers.step.2': '“Bağlantıyı test et”e, sonra “Kaydet”e tıkla. Rozet “Bağlı” olur.',
  'help.guide.photo-providers.result':
    'Kayıt düzenleyicisindeki “External photos” sekmesi, bağlı kitaplıkta kaydın gününü arar; önce kaydın konumuna en yakın fotoğrafları gösterir.',
  'help.guide.photo-providers.tip.1':
    "Bağlantı yalnızca hesabınıza aittir: bir Journey'in diğer üyeleri kendi kitaplıklarını bağlar.",
  'help.guide.photo-providers.tip.2':
    'Fotoğraflarında GPS verisi olmayan bir sağlayıcı da çalışır. Bu durumda liste zamana göre sıralanır.',
  // api-keys
  'help.guide.api-keys.title': 'API anahtarı oluşturun',
  'help.guide.api-keys.goal': 'Diğer yazılımların seyahatlerinizi herkese açık API üzerinden okumasına izin verin.',
  'help.guide.api-keys.step.1':
    "API Anahtarları altında Anahtar oluştur'a tıklayın, anahtarın nerede kullanılacağını belirten bir Ad verin ve Bu anahtar neleri okuyabilir altında yalnızca ihtiyaç duyduğu alanları bırakın. Sonra Oluştur'a tıklayın.",
  'help.guide.api-keys.step.2':
    "Anahtarı API anahtarı oluşturuldu penceresinden kopyalayın: yalnızca bir kez gösterilir. Bitti'ye tıklayın. Çağıracağınız Uç nokta listenin altında yer alır.",
  'help.guide.api-keys.result':
    'Anahtara sahip yazılım, seçtiğiniz alanları okuyabilir ama hiçbir şeyi değiştiremez. Listede her anahtarın ne zaman oluşturulduğu ve en son ne zaman kullanıldığı görünür, çöp kutusu anahtarı siler.',
  'help.guide.api-keys.tip.1':
    'Her araç için ayrı bir anahtar kullanın; böylece bir anahtarı iptal ederken diğer araçlar etkilenmez.',
  'help.guide.api-keys.tip.2':
    'Bir yapay zeka istemcisinin değişiklik yapabilmesi için bunun yerine OAuth ile MCP kullan; API anahtarları yalnızca okuma yapar.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCP ile bir yapay zekâ asistanı bağlayın',
  'help.guide.mcp-oauth.goal': 'Claude’a, bir IDE’ye ya da başka bir MCP istemcisine seyahatlerinize erişim verin.',
  'help.guide.mcp-oauth.step.1': '“MCP Yapılandırması” altında istemcin için “MCP Uç Noktası”nı kopyala.',
  'help.guide.mcp-oauth.step.2':
    "“OAuth 2.1 İstemcileri” altında “Yeni Müşteri”ye tıkla ve Claude Desktop veya Cursor gibi bir hızlı ön ayar seç ya da “Uygulama Adı”, “URI'leri Yönlendir” ve “İzin Verilen Kapsamlar” alanlarını kendin doldur; tarayıcısı olmayan bir sunucu için “makine” istemcisini seç. “Müşteriyi Kaydet”e tıkla ve “Müşteri Sırrı”nı kopyala: yalnızca bir kez gösterilir.",
  'help.guide.mcp-oauth.step.3':
    'Her istemcide Gizli Anahtarı Döndür ve İstemciyi Sil bulunur. Aktif OAuth Oturumları, giriş yapmış istemcileri Geri çek düğmesiyle birlikte listeler. İstemci Yapılandırması, JSON kullanan istemciler için hazır bir kod parçası gösterir.',
  'help.guide.mcp-oauth.result':
    'İstemci, kapsamlarının izin verdiği şeyleri sizin adınıza okuyabilir ve değiştirebilir; her işlem sizin adınız altında görünür.',
  'help.guide.mcp-oauth.tip.1':
    'Kapsamlar, bir istemcinin neler yapabileceğini sınırlar: daha fazlasına ihtiyaç duyana kadar istemciye yalnızca okuma kapsamını verin.',
  'help.guide.mcp-oauth.tip.2': "Yönetici MCP'yi tüm örnek için kapatabilir. Bu durumda bu bölüm görünmez.",
  // offline-prepare
  'help.guide.offline-prepare.title': 'Seyahatleri çevrimdışı kullanıma hazırlayın',
  'help.guide.offline-prepare.goal': 'Bağlantınız kopmadan önce seyahatlerinizi ve haritalarını bu cihaza kaydedin.',
  'help.guide.offline-prepare.step.1':
    "Çevrimdışı olarak ne saklanacak altında Harita kutucuklarını çevrimdışı sakla'yı açık tutun ve bu cihazda olmasını istediğiniz seyahatleri açın. Bitmiş bir seyahat yalnızca siz açarsanız saklanır.",
  'help.guide.offline-prepare.step.2':
    "Yukarıya dönün, Çevrimdışı için hazırlan altında Çevrimdışı kullanım için indir'e tıklayın. Seyahat verilerini, belgeleri ve harita karolarını indirir, kaç seyahat sakladığını da söyler.",
  'help.guide.offline-prepare.step.3':
    'Çevrimdışı modu zorla bir kez daha indirir, sonra yalnızca bu cihazdan çalışır. Böylece yola çıkmadan her şeyin cihazda olduğunu kontrol edebilirsiniz.',
  'help.guide.offline-prepare.result':
    'Seyahatler bağlantı olmadan açılır. Yaptığınız değişiklikler bir kuyruğa kaydedilir ve yeniden çevrimiçi olduğunuzda gönderilir.',
  'help.guide.offline-prepare.tip.1':
    'Harita karoları en çok yer kaplar; yalnızca seyahat verilerini ve belgeleri tutmak için bunları kapat.',
  'help.guide.offline-prepare.tip.2':
    'En sorunsuz çevrimdışı başlangıç için TREK’i tarayıcıdan uygulama olarak yükleyin.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Eşitleme çakışmasında hangi sürümün kalacağına karar verin',
  'help.guide.offline-conflicts.goal':
    "Çevrimdışı yapılan bir değişiklik başka yerde yapılan bir değişiklikle çakıştığında TREK'in bunu nasıl çözeceğini seçin.",
  'help.guide.offline-conflicts.step.1':
    'Çevrimdışıyken yaptığın bir değişiklik daha yeni bir değişiklikle çakışırsa “Çevrimdışı”nın üst kısmına yakın bir yerde “Senkronizasyon çakışmaları” görünür. Her değişiklik için “Benimki” veya “Onlarınkini sakla”ya tıkla.',
  'help.guide.offline-conflicts.step.2':
    'Aynı kartta “Bir çakışma olduğunda” bir sonraki sefer için karar verir: “Her seferinde bana sor”, “Her zaman benim sürümümü sakla” veya “Her zaman sunucu sürümünü sakla”.',
  'help.guide.offline-conflicts.result':
    'Her seferinde bana sor seçiliyken bir çakışma, siz karar verene kadar Senkronizasyon çakışmaları içinde bekler. Diğer iki seçenekte TREK çakışmayı kendisi çözer.',
  'help.guide.offline-conflicts.tip.1':
    '“Önbelleği temizle” yalnızca bu cihazdaki kopyayı kaldırır. Sunucudaki hiçbir şey değişmez.',
  // profile
  'help.guide.profile.title': 'Profilinizi değiştirin',
  'help.guide.profile.goal': 'Adınızı, e-posta adresinizi ve fotoğrafınızı güncelleyin.',
  'help.guide.profile.step.1':
    'Hesap kartında resim yüklemek için resminizin üzerindeki kameraya tıklayın. Kırmızı çöp kutusu resmi kaldırır ve baş harfinizi geri getirir.',
  'help.guide.profile.step.2': 'Resmin altındaki Kullanıcı adı ve E-posta alanlarını düzenleyin.',
  'help.guide.profile.result': 'Adınız ve fotoğrafınız paylaştığınız seyahatler dahil her yerde aynı anda güncellenir.',
  'help.guide.profile.tip.1':
    'SSO ile bağlanan bir hesapta SSO rozeti ve sağlayıcısıyla birlikte “ile bağlantılı” ifadesi görünür.',
  // password
  'help.guide.password.title': 'Şifrenizi değiştirin',
  'help.guide.password.goal': 'Yeni bir şifre belirleyin.',
  'help.guide.password.step.1':
    '“Şifre Değiştir” altında “Mevcut Şifre”ni gir, sonra “Yeni Şifre”yi ve aynısını “Yeni şifreyi onayla” alanına yaz. Aşağıdaki liste, yazdıkça her kuralı karşılanmış olarak işaretler.',
  'help.guide.password.step.2': '“Şifreyi güncelle” düğmesine tıklayın.',
  'help.guide.password.result':
    'Yeni şifre hemen geçerli olur. Diğer tüm cihazların oturumu kapatılır, MCP API belirteçlerin silinir ve OAuth istemcilerinin yeniden giriş yapması gerekir; bu cihazdaki oturum açık kalır.',
  'help.guide.password.tip.1':
    "Bu TREK'e yalnızca SSO ile giriş yapılıyorsa TREK şifresi ve Şifre Değiştir kartı olmaz.",
  // mfa
  'help.guide.mfa.title': 'İki faktörlü kimlik doğrulamayı açın',
  'help.guide.mfa.goal': 'Hesabı, kimlik doğrulayıcı uygulamasından aldığınız kodla koruyun.',
  'help.guide.mfa.step.1': '“İki faktörlü kimlik doğrulama (2FA)” bölümünde “Kimlik doğrulayıcıyı ayarla”ya tıklayın.',
  'help.guide.mfa.step.2':
    "QR kodunu uygulamanızla tarayın ya da gizli anahtarı elle girin, sonra uygulamanın gösterdiği altı haneli kodu yazıp “2FA'yı Etkinleştir”e tıklayın.",
  'help.guide.mfa.step.3':
    "Yedek kodları Kodları kopyala, TXT'yi İndirin ya da Yazdır / PDF ile kaydedin, sonra Tamam'a tıklayın. Her kod yalnızca bir kez çalışır. Telefonunuz yanınızda olmadığında bir kod kullanın.",
  'help.guide.mfa.result': 'Her oturum açışta şifreden sonra bir kod istenir.',
  'help.guide.mfa.tip.1':
    "2FA'yı devre dışı bırak için şifreniz ve güncel bir kod ya da kullanılmamış bir yedek kod gerekir.",
  'help.guide.mfa.tip.2': 'Yönetici 2FA’yı herkes için zorunlu kılabilir; bu durumda burada kapatılamaz.',
  // passkeys
  'help.guide.passkeys.title': 'Passkey ile oturum açın',
  'help.guide.passkeys.goal': "Şifre yerine cihazınızın parmak izini, yüz tanımasını ya da PIN'ini kullanın.",
  'help.guide.passkeys.step.1':
    "Passkey’ler altında Passkey ekle'ye tıklayın, mevcut şifrenizi onaylayın ve hangi cihaz olduğunu belirten bir ad verin, sonra cihazınızın yönergesini izleyin.",
  'help.guide.passkeys.step.2':
    "Her passkey'in “Eşitlendi” mi yoksa “Bu cihaz”a mı bağlı olduğu ve en son ne zaman kullanıldığı görünür. “Yeniden adlandır” adını değiştirir, silme düğmesi ise şifreni girdikten sonra passkey'i kaldırır.",
  'help.guide.passkeys.result':
    'Oturum açma sayfası passkey seçeneğini sunar. Şifrenizle de oturum açmaya devam edebilirsiniz.',
  'help.guide.passkeys.tip.1':
    'Passkey cihazda ya da cihazın şifre yöneticisinde saklanır; bu yüzden her cihaz için bir passkey ekleyin.',
  'help.guide.passkeys.tip.2':
    "Passkey'ler yalnızca yönetici açtığında görünür. Sunucuda WebAuthn alan adı tanımlanana kadar kart, “Passkey ekle” seçeneği yerine bunu bildirir.",
  // delete-account
  'help.guide.delete-account.title': 'Hesabınızı silin',
  'help.guide.delete-account.goal': 'Hesabınızı ve yalnızca size ait verileri silin.',
  'help.guide.delete-account.step.1':
    '“Hesap” kartında altbilgisinin solundaki “Hesabı sil”e, sonra “Kalıcı olarak sil”e tıkla.',
  'help.guide.delete-account.result':
    'Hesabın, sahibi olduğun seyahatler, yerler ve dosyalarla birlikte silinir. Başkalarının sahibi olduğu seyahatler korunur.',
  'help.guide.delete-account.tip.1':
    'Tek yönetici sizseniz TREK Silme mümkün değil uyarısını gösterir. Önce başka bir kullanıcıyı yönetici yapın.',
  'help.guide.delete-account.tip.2': 'Geri alma yoktur. Onaylamadan önce saklamak istediklerinizi dışa aktarın.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Yönetici',
  'help.ctx.admin.summary':
    'Tüm kullanıcılar için TREK sunucusunun genel ayarları: kimin nasıl giriş yapabileceği, nelerin açık olduğu, dosyaların nerede saklandığı, sunucunun insanlara nasıl ulaştığı ve nasıl yedeklendiği. Bu sayfayı yalnızca yöneticiler görür. Kenar çubuğu sekmeleri Kullanıcılar, Yapılandırma, Entegrasyonlar ve Bakım başlıkları altında toplar; her sekme ayrı bir ekrandır.',
  'help.ctx.admin.bullet.1':
    'Başlığın sağında kullanıcı, seyahat, yer ve dosya sayıları görünür. Altında, daha yeni bir TREK sürümü çıktığında Güncelleme mevcut bannerı belirir.',
  'help.ctx.admin.bullet.2':
    'Kullanıcılar ve Kullanıcı Varsayılanları: hesaplar, davet bağlantıları ve izinler; ayrıca yeni bir hesabın başlangıçta kullanacağı ayarlar ve harita.',
  'help.ctx.admin.bullet.3':
    "Kişiselleştirme, Ayarlar, Eklentiler, Plugin'ler ve Depolama: paketleme şablonları, kategoriler ve okul tatilleri; giriş, passkey'ler, 2FA, API anahtarları ve arama sağlayıcıları; özellik modülleri; üçüncü taraf plugin'ler; yüklemelerin gittiği yer.",
  'help.ctx.admin.bullet.4':
    'Bildirimler, MCP Erişimi ve GitHub: kullanıcıların seçebileceği kanallar ve başlangıç varsayılanları, yapay zeka istemcilerinin belirteçleri ve oturumları ve sürüm geçmişi.',
  'help.ctx.admin.bullet.5':
    'Yedekleme ve Denetim: isteğe bağlı ve zamanlanmış yedeklemeler ile güvenlikle ilgili olayların günlüğü.',
  'help.ctx.admin-users.title': 'Kullanıcılar',
  'help.ctx.admin-users.summary':
    "Bu TREK'teki tüm hesaplar; rolleri, e-postaları ve en son ne zaman etkin olduklarıyla birlikte, kapalı bir kurulumda insanların kayıt olmasını sağlayan davet bağlantıları ve seyahatlerde kimin neyi yapabileceği.",
  'help.ctx.admin-users.bullet.1':
    'Tablo: kullanıcı, e-posta, rol, oluşturulma tarihi ve “Son Etkinlik”; her satırda “Kullanıcıyı Düzenle” ve “Kullanıcıyı sil” var. Avatardaki yeşil nokta kişinin şu anda çevrimiçi olduğunu gösterir. Kendi satırında “(Siz)” yazar.',
  'help.ctx.admin-users.bullet.2':
    'Kullanıcılar kartının sağ üstündeki Kullanıcı Oluştur, kullanıcıya vereceğiniz bir şifreyle elle hesap ekler.',
  'help.ctx.admin-users.bullet.3':
    'Aşağıdaki Bağlantıları Davet Et: kullanım sınırı, son kullanma tarihi ve isterseniz yeni kullanıcının kayıt olunca katılacağı bir seyahat içeren kayıt bağlantıları.',
  'help.ctx.admin-users.bullet.4':
    "En alttaki İzin Ayarları: her işlem için kimin yapabileceği (Herkes, Seyahat üyeleri, Seyahat sahibi ya da Yalnızca yönetici). Kaydetmek için kartın üstündeki Kaydet'e tıklayın.",
  'help.ctx.admin-defaults.title': 'Kullanıcı Varsayılanları',
  'help.ctx.admin-defaults.summary':
    'Yeni bir hesabın hangi ayarlarla başlayacağı, böylece kimsenin önce bunları kurması gerekmez: renk modu, birimler, saat biçimi, haftanın ilk günü, görüntüleme para birimi ve bulanıklaştırılmış rezervasyon kodları; ayrıca harita, anahtarları ve yönlendirme sunucuları.',
  'help.ctx.admin-defaults.bullet.1':
    'Solda “Varsayılan Kullanıcı Ayarları”: “Renk Modu”, “Sıcaklık Birimi”, “Mesafe Birimi”, “Saat Biçimi”, “Hafta başlangıcı”, “Görüntüleme para birimi” ve “Rezervasyon Kodlarını Bulanıklaştır”.',
  'help.ctx.admin-defaults.bullet.2':
    'Sağda Harita: “Harita Şablonu”, “Paylaşılan CARTO anahtarı”, “Kendi rota motoru” ve “Kendi Valhalla sunucunuz”, bir önizleme, ardından “Harita motoru” ile “Harita stili”, “Paylaşılan Mapbox jetonu”, “3D binalar & arazi” ve “Yüksek kalite modu”.',
  'help.ctx.admin-config.title': 'Kişiselleştirme',
  'help.ctx.admin-config.summary':
    'Sunucudaki tüm seyahatlerin ortak kullandığı ayarlar: paket şablonları, yerler ve koleksiyonlar için kategori seti ve Tatil’in kullandığı okul tatili kataloğu.',
  'help.ctx.admin-config.bullet.1':
    'Paketleme Şablonları: bir seyahatin paket listesinin başlangıç noktası olabilecek, adlandırılmış kategori ve öğe listeleri.',
  'help.ctx.admin-config.bullet.2':
    "Kategoriler: yer denetçisinden Koleksiyonlar'a kadar TREK'te kullanılan kategorilerin adı, simgesi ve rengi; her biri önizlemeli bir pencerede düzenlenir.",
  'help.ctx.admin-config.bullet.3':
    "Okul tatilleri: ülkelerin ve bölgelerin tatil dönemleriyle birlikte kataloğu. Herkes bunu Tatil'de seçebilir.",
  'help.ctx.admin-settings.title': 'Ayarlar',
  'help.ctx.admin-settings.summary':
    'İnsanların nasıl giriş yaptığı ve sunucunun hangi harici hizmetleri kullanabileceği. Solda: Kimlik Doğrulama Yöntemleri, Passkey ile oturum açma, İki faktörlü kimlik doğrulama (2FA) gerektir ve Tek Oturum Açma (OIDC). Sağda: İzin Verilen Dosya Türleri ve arama ile toplu taşıma sağlayıcılarının bulunduğu API Anahtarları. Tehlikeli Bölge en alttadır.',
  'help.ctx.admin-settings.bullet.1':
    'Kimlik Doğrulama Yöntemleri: Şifre Girişi, Şifre Kaydı ve OIDC kurulduktan sonra TOA Girişi ile SSO Otomatik Temel Hazırlığı. İki faktörlü kimlik doğrulama (2FA) gerektir için ayrı bir kart vardır.',
  'help.ctx.admin-settings.bullet.2':
    "Passkey ile oturum açma: Passkey ile oturum açmayı etkinleştir, Relying Party ID (alan adı) ve İzin verilen kaynaklar. Tek Oturum Açma (OIDC): Ekran Adı, Veren URL'si, isteğe bağlı Discovery URL, Müşteri Kimliği ve Müşteri Sırrı.",
  'help.ctx.admin-settings.bullet.3':
    'API Anahtarları: TREK Places API en başta gelir ve anahtar gerektirmez. Altında “Google Haritalar API Anahtarı” (“Test et” ve “Anahtarın ne için kullanıldığı” ile), Unsplash ve Amap anahtarı bulunur; kartın altında tek bir “Kaydet” düğmesi vardır.',
  'help.ctx.admin-settings.bullet.4':
    '“Toplu taşıma sağlayıcısı” ve “Yer arama sağlayıcısı”, toplu taşıma ve yer aramalarını kimin yanıtlayacağını seçer. “Yer arama günlüğü” hangi sonucun seçildiğini kaydeder. “İzin Verilen Dosya Türleri” yüklemeleri sınırlar.',
  'help.ctx.admin-addons.title': 'Eklentiler',
  'help.ctx.admin-addons.summary':
    "TREK'in özellik modülleri, her birinin bir anahtarı var: Paketleme, Bütçe, Belgeler, Tatil, Atlas, İş birliği, Journey, Koleksiyonlar, Yol gezisi, MCP, AirTrail, Dawarich ve yapay zekâ ile ayrıştırma. Kapalı olması, gezinme girdisinin, rotaların ve API'nin herkes için kaldırıldığı anlamına gelir.",
  'help.ctx.admin-addons.bullet.1':
    'Her eklenti için bir kutucuk; üzerinde anahtarı ve varsa seçenekleri için alt satırlar bulunur.',
  'help.ctx.admin-addons.bullet.2':
    'Fotoğraf sağlayıcıları ve belge sağlayıcıları da burada kutucuk olarak görünür; böylece kullanıcılara Immich ya da Synology sunulabilir.',
  'help.ctx.admin-addons.bullet.3': '“Çanta Takibi”nin kutucukların altında kendi anahtarı vardır.',
  'help.ctx.admin-plugins.title': "Plugin'ler",
  'help.ctx.admin-plugins.summary':
    "TREK'in yanında kendi süreçlerinde çalışan üçüncü taraf eklentiler. Her biri kurulumda istediği izinlere sahiptir. Katalogdan kurabilir, paket yükleyebilir ya da bir eklenti geliştirirken klasör bağlayabilirsiniz.",
  'help.ctx.admin-plugins.bullet.1':
    '“Yüklü” ve “Keşfet”; “Eklenti ara…” ile “Tür”, “Durum” ve “Sırala” filtreleri. Her satırda sürüm, “İncelendi”, “İmzalı” veya “İmzasız”, eklentinin nelere erişebildiği, bir anahtar ve bir ⋯ menüsü görünür.',
  'help.ctx.admin-plugins.bullet.2':
    'Kart başlığındaki iki simge: Eklenti yükle bir .zip, .tgz ya da .tar.gz dosyası kabul eder (sayfaya bir .zip da bırakabilirsiniz). Yeniden tara, geliştirme için bağlanmış bir eklenti klasörünü bulur.',
  'help.ctx.admin-plugins.bullet.3':
    'Eklenti başına “İzin verilen ana bilgisayarlar”: bir eklentinin çağırabileceği adresler, çünkü giden bağlantılar varsayılan olarak engellenir.',
  'help.ctx.admin-storage.title': 'Depolama',
  'help.ctx.admin-storage.summary':
    "Yüklemelerin nerede saklandığı: yerel disk ya da bir S3 kovası; isteğe bağlı olarak başka depolama birimlerine de kopyalanır. Her yükleme kategorisi farklı bir depolama birimine gidebilir. Değişiklikleri kaydet'e tıklamadan hiçbir şey değişmez.",
  'help.ctx.admin-storage.bullet.1':
    'Üstteki Sağlık: bir ayna hedefine yapılan başarısız yazmalar ya da Kaydedilmiş kopya hatası yok.',
  'help.ctx.admin-storage.bullet.2':
    'Arka uçlar: ad, tür, kullanım ve Mirrored to; Test et, Düzenle ve Kaldırmak düğmeleriyle. Şimdi hesapla, saklananı sayar. Ortam değişkeniyle tanımlanan bir arka uç salt okunurdur.',
  'help.ctx.admin-storage.bullet.3':
    'Kategoriler: seyahat belgeleri, journey fotoğrafları, kapaklar, profil resimleri, yer görselleri, fotoğraf önbellekleri ve yedekler. Her biri bir depolama arka ucuna atanır.',
  'help.ctx.admin-notifications.title': 'Bildirimler',
  'help.ctx.admin-notifications.summary':
    'Sunucunun kullanıcılarına sunduğu kanallar ve yönetici olarak sizin aldığınız kanallar. Kullanıcılar kendi konularını ve URL’lerini “Ayarlar” altında seçer; nelerin var olacağına siz karar verirsiniz ve e-postayı siz yapılandırırsınız.',
  'help.ctx.admin-notifications.bullet.1':
    '“E-posta (SMTP)”, “Web kancası”, Ntfy ve “Web anlık bildirimleri” için kanalı kullanıcılara sunan birer anahtar vardır; e-posta için ayrıca sunucu ayarları gerekir. “Uygulama içi” her zaman açıktır.',
  'help.ctx.admin-notifications.bullet.2':
    '“Seyahat Hatırlatıcıları”: sunucunun bir seyahat başlamadan önce hatırlatma gönderip göndermeyeceği.',
  'help.ctx.admin-notifications.bullet.3':
    '“Yönetici Webhook”, “Yönetici Ntfy” ve Bildirimler kartı: yönetici olaylarının (“Yeni sürüm mevcut”, “Depolama kopyası hatası”, “Kürek bölgesi istendi”) gittiği yer; her birinde bir test düğmesi var.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Erişimi',
  'help.ctx.admin-mcp-tokens.summary':
    'Yapay zekâ istemcilerinin bu TREK için sahip olduğu tüm belirteçler ve OAuth oturumları, tüm kullanıcılar dahil. Hepsini iptal edebilirsiniz.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth Oturumları: istemci, ona verilen kapsamlar, sahibi ve tarih. Çöp kutusu simgesi oturumu iptal eder.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API Belirteçleri: ad, sahibi, Oluşturulma ve Son Kullanılan; belirteci silen bir çöp kutusuyla.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    "TREK'teki yenilikler: GitHub'daki sürüm geçmişi ve sizinkinden daha yeni bir sürüm olup olmadığı. Güncellemenin kendisi uygulamada değil, ana makinede yapılır.",
  'help.ctx.admin-github.bullet.1':
    'Sürüm Geçmişi, sürümleri notlarıyla birlikte zaman çizelgesi olarak listeler. En yenisinde En sonuncu etiketi bulunur, ön sürümlerde Ön sürüm yazar, GitHub ise sürümler sayfasını açar.',
  'help.ctx.admin-github.bullet.2':
    'Daha yeni bir sürüm çıkınca sayfa başlığının altında “Güncelleme mevcut” görünür; “Nasıl Güncellenir?” Docker için komutları, diğer kurulumlar için güncelleme kılavuzunu gösterir.',
  'help.ctx.admin-backup.title': 'Yedekleme',
  'help.ctx.admin-backup.summary':
    'Veritabanının ve yüklemelerin tam yedekleri; elle ya da zamanlanmış olarak alınır, sunucuda saklanır ve tek dosya olarak indirilebilir. Bir yedeği geri getirmek için “Geri yükle”yi kullanın.',
  'help.ctx.admin-backup.bullet.1':
    'Veri Yedekleme: kartın üstünde “Yedek Oluştur” ve “Yedek Yükle”, altında yedek listesi; her yedekte “İndir”, “Geri yükle” ve silmek için bir çöp kutusu simgesi var.',
  'help.ctx.admin-backup.bullet.2':
    '“Yedek Yükle”, başka bir kurulumda ya da daha önceki bir günde alınmış bir dosyadan “Geri yükle” ile aynı soruyu sorduktan sonra geri yükleme yapar.',
  'help.ctx.admin-backup.bullet.3':
    'Otomatik yedekleme: açık ya da kapalı, Aralık, Çalışma saati ve gün, ayrıca Eski yedekleri şu süreden sonra sil (1 gün ile Sonsuza kadar sakla arasında). Ayarlar Kaydet ile uygulanır.',
  'help.ctx.admin-audit.title': 'Denetim',
  'help.ctx.admin-audit.summary':
    'Güvenlikle ilgili ve yönetsel olayların günlüğü: oturum açmalar ve başarısız denemeler, MFA değişiklikleri, kullanıcı ve ayar değişiklikleri, yedeklemeler ve geri yüklemeler. Salt okunurdur, en yeni olay en üsttedir.',
  'help.ctx.admin-audit.bullet.1': 'Her olay için bir satır: zaman, kullanıcı, işlem, kaynak, IP ve ayrıntılar.',
  'help.ctx.admin-audit.bullet.2':
    'Kart başlığındaki Yenile listeyi yeniden yükler. Başlığın yanındaki rozet, toplam kayıttan kaçının yüklendiğini gösterir; Daha fazlasını yükle daha eski kayıtları getirir.',
  // create-user
  'help.guide.create-user.title': 'Kullanıcı oluşturun',
  'help.guide.create-user.goal': 'Davet olmadan elle bir hesap ekleyin.',
  'help.guide.create-user.step.1': "Kullanıcılar kartının sağ üstündeki Kullanıcı Oluştur'a tıklayın.",
  'help.guide.create-user.step.2':
    "Kullanıcı adı, E-posta ve bir Şifre girin. Şifrenin altındaki kontrol listesi, şifrenin hangi kuralları karşıladığını gösterir. Rol'ü seçin: Kullanıcı ya da Yönetici.",
  'help.guide.create-user.step.3': '“Kullanıcı Oluştur”a tıklayın.',
  'help.guide.create-user.result':
    'Hesap tabloda görünür ve hemen oturum açabilir. Şifreyi kişiye güvendiğiniz bir kanaldan iletin.',
  'help.guide.create-user.tip.1':
    'Kendi şifresini kendisi seçmesi gereken biri için davet bağlantısı daha iyi bir yoldur.',
  'help.guide.create-user.tip.2':
    'Yönetici bu sayfayı görür ve her şeyi yapabilir. Kullanıcının seyahatlerde neler yapabileceği aşağıda “İzin Ayarları” altında belirlenir.',
  // edit-user
  'help.guide.edit-user.title': 'Bir kullanıcının bilgilerini veya şifresini değiştir',
  'help.guide.edit-user.goal':
    'Birinin adını değiştir, yetkisini yükselt veya düşür ya da şifresini kaybedince yeniden giriş yapmasına yardım et.',
  'help.guide.edit-user.step.1':
    'Kullanıcının satırındaki kalem simgesine (“Kullanıcıyı Düzenle”) tıkla. Pencerenin en üstünde hesabın e-postası görünür.',
  'help.guide.edit-user.step.2':
    "Kullanıcı adı, E-posta ya da Rol'ü değiştirin veya Yeni Şifre yazın (mevcut şifreyi korumak için boş bırakın), sonra Kaydet'e tıklayın. En alttaki Passkey’leri sıfırla, onayınızdan sonra hesabın tüm passkey'lerini kaldırır.",
  'help.guide.edit-user.result':
    'Değişiklik anında uygulanır. Yeni bir şifre ayrıca kişinin tüm cihazlardaki oturumunu kapatır, yani eski bir oturum çalışmaz olur.',
  'help.guide.edit-user.tip.1': 'Son yönetici olduğunuz sürece yönetici rolünü kendinizden alamazsınız.',
  'help.guide.edit-user.tip.2':
    'Passkey’leri sıfırlamak şifreyi korur; kişi yeni passkey’lerini “Ayarlar”, “Hesap” altından ekler.',
  // invite-links
  'help.guide.invite-links.title': 'Birini bağlantıyla davet edin',
  'help.guide.invite-links.goal':
    'Birinin kapalı bir örnekte kaydolmasını ve isterseniz bir seyahate eklenmesini sağlayın.',
  'help.guide.invite-links.step.1': "Bağlantıları Davet Et kartının sağ üstündeki Bağlantı Oluştur'a tıklayın.",
  'help.guide.invite-links.step.2':
    "Maks. Kullanım Alanları'nı (1× ile 5× arası ya da ∞) ve Şu tarihten sonra sona erer: değerini (1g ile 14g arası ya da ∞) seçin. İsterseniz Seyahate ekle (isteğe bağlı) altında bir seyahat seçin, sonra Oluştur ve Kopyala'ya tıklayın.",
  'help.guide.invite-links.step.3':
    'Bağlantıyı gönder. Her satırda bağlantının kaç kez kullanıldığı, ne zaman sona ereceği, hangi seyahate ekleme yaptığı ve kimin oluşturduğu görünür; yanında “Aktif”, “Günü geçmiş” veya “Kullanılmış” yazar. “Bağlantıyı kopyala” bağlantıyı yeniden kopyalar, çöp kutusu siler.',
  'help.guide.invite-links.result':
    'Bağlantıyı açan kişi kendi şifresiyle kaydolur. Bir seyahat seçilmişse hemen o seyahate katılır.',
  'help.guide.invite-links.tip.1': 'Davet bağlantıları, “Ayarlar” altında “Şifre Kaydı” kapalı olsa bile çalışır.',
  'help.guide.invite-links.tip.2':
    'Tek bir kişi için en güvenli varsayılan, tek kullanımlık ve kısa süreli bir bağlantıdır.',
  // delete-user
  'help.guide.delete-user.title': 'Bir kullanıcıyı silin',
  'help.guide.delete-user.goal': 'Bir hesabı ve ona ait her şeyi kaldır.',
  'help.guide.delete-user.step.1':
    'Kullanıcının satırındaki çöp kutusuna (“Kullanıcıyı sil”) tıkla ve “Sil” ile onayla.',
  'help.guide.delete-user.result':
    "Hesap, sahibi olduğu tüm seyahatler ve journey'lerle birlikte silinir; başkalarıyla paylaştığı seyahatler de dahil. Yalnızca üyesi olduğu seyahatler sahiplerinde kalır.",
  'help.guide.delete-user.tip.1': 'Geri alma yoktur. Emin değilseniz önce yedek alın.',
  'help.guide.delete-user.tip.2':
    'Kendi satırınızdaki çöp kutusu çalışmaz, çünkü kendinizi silemezsiniz. Bunu başka bir yöneticinin yapması gerekir.',
  // permissions
  'help.guide.permissions.title': 'Kimin neyi yapabileceğine karar verin',
  'help.guide.permissions.goal': "Bu TREK'te her eylemi hangi rolün yapabileceğini belirleyin.",
  'help.guide.permissions.step.1':
    'İzin Ayarları altında işlemi kendi grubunda bulun, örneğin Seyahat Yönetimi altında Seyahatleri sil, ve kimin yapabileceğini seçin: Herkes, Seyahat üyeleri, Seyahat sahibi ya da Yalnızca yönetici. Değiştirilen satır özelleştirildi olarak işaretlenir.',
  'help.guide.permissions.step.2':
    "Kartın sağ üstündeki Kaydet'e tıklayın. Varsayılanlara sıfırla her satırı yerleşik düzeyine döndürür; ondan sonra da Kaydet'e tıklayın.",
  'help.guide.permissions.result':
    'Kural tüm seyahatlere aynı anda uygulanır. Seviyenin altındaki kişiler bu eyleme ait düğmeleri ve menüleri artık görmez.',
  'help.guide.permissions.tip.1':
    '“Seyahat sahibi”, seyahati oluşturan kişidir; yöneticiler her zaman her şeyi yapabilir.',
  'help.guide.permissions.tip.2':
    'Her işlem ayrı bir satırdır. Böylece örneğin üyelerin yerleri ve günleri planlamasına izin verip seyahati silme yetkisini sahibine bırakabilirsiniz.',
  // default-map
  'help.guide.default-map.title': 'Yeni kullanıcılar için harita varsayılanlarını ayarlayın',
  'help.guide.default-map.goal': 'Her yeni hesaba kişisel belirteç gerektirmeden çalışan bir harita verin.',
  'help.guide.default-map.step.1':
    "Harita altında bir Harita Şablonu seçin ya da bir karo URL'si yapıştırın; CARTO karoları kullanıyorsanız bir Paylaşılan CARTO anahtarı girin. Aşağıdaki önizleme sonucu gösterir.",
  'help.guide.default-map.step.2':
    'Biraz aşağıda “Harita motoru”nu seç: “Standart (ücretsiz)”, Mapbox (3D) veya MapLibre (OpenFreeMap). Mapbox ve MapLibre için “Harita stili”ni seç; Mapbox için ayrıca “Paylaşılan Mapbox jetonu”nu ekle ve “3D binalar & arazi” ile “Yüksek kalite modu” için karar ver.',
  'help.guide.default-map.result':
    'Yeni hesaplar bu ayarlarla başlar. “Ayarlar” altında kendi haritasını ayarlayanlar kendi ayarını korur.',
  'help.guide.default-map.tip.1':
    'Buraya girilen bir belirteç veya anahtar, kendi anahtarı olmayan herkes tarafından ortak kullanılır, bu yüzden kotasına dikkat et.',
  'help.guide.default-map.tip.2':
    'Harita sekmesinde hiçbir şeyi değiştirmemiş mevcut hesaplar da bu varsayılanları kullanır.',
  // packing-templates
  'help.guide.packing-templates.title': 'Paketleme şablonu oluşturun',
  'help.guide.packing-templates.goal':
    'Seyahatlere boş liste yerine, başlangıç noktası olacak bir paketleme listesi verin.',
  'help.guide.packing-templates.step.1': '“Yeni Şablon”a tıklayın, bir ad yazın ve onay işaretiyle onaylayın.',
  'help.guide.packing-templates.step.2':
    'Şablonu açmak için adına tıkla, sonra “Kategori ekle”ye tıkla. Kategorinin başlığındaki + öğe ekler; bir öğe için yalnızca ad yeterlidir.',
  'help.guide.packing-templates.step.3':
    'Her şey sen çalışırken kaydedilir. Kalem simgesi bir şablonu, kategoriyi veya öğeyi yeniden adlandırır. Çöp kutusu bir öğeyi hemen siler; şablon veya kategori için önce sorar, çünkü içindeki her şey de silinir.',
  'help.guide.packing-templates.result':
    'Şablon her seyahatin paket listesinde sunulur. Uygulamak öğeleri kopyalar; böylece her seyahat öğeleri istediği gibi değiştirebilir.',
  'help.guide.packing-templates.tip.1':
    'Her seyahat türü için ayrı bir şablon (plaj, şehir, yürüyüş), tek bir çok uzun listeden daha iyi çalışır.',
  'help.guide.packing-templates.tip.2': 'Bir şablonu silmek, onu zaten uygulamış seyahatleri etkilemez.',
  'help.guide.packing-templates.tip.3':
    'Bir seyahatin paket listesindeki Şablon olarak kaydet, her öğenin ağırlığı, miktarı ve çantasıyla bir şablon oluşturur. Bunlar burada öğenin yanında görünür; şablonu uyguladığınızda öğeler aynı çantalara girer.',
  // categories
  'help.guide.categories.title': 'Kategorileri yönetin',
  'help.guide.categories.goal':
    'Yerlerin ve koleksiyonların hangi kategorilere sahip olabileceğine ve nasıl görüneceklerine karar verin.',
  'help.guide.categories.step.1':
    "Yeni Kategori'ye tıklayın, adı pencerenin başlık satırına yazın, bir Simge ve bir Renk seçin, Önizleme'yi kontrol edin. Sonra Oluştur'a tıklayın.",
  'help.guide.categories.step.2':
    'Listede kalem simgesi (Düzenle) bir kategoriyi açar, Güncelle kaydeder. Çöp kutusu (Sil), onayınızdan sonra kategoriyi kaldırır.',
  'help.guide.categories.result':
    'Küme her yerde aynı anda geçerli olur: yer denetçisi, harita iğneleri, Koleksiyonlar ve filtreler.',
  'help.guide.categories.tip.1':
    'Yerler kategorilerinin kimliğini korur; bu yüzden bir kategoriyi yeniden adlandırırsanız her yerde yeni adıyla görünür.',
  'help.guide.categories.tip.2':
    'Bir kategoriyi silerseniz yerleri kategorisiz kalır. Bu önemliyse önce yerleri başka bir kategoriye atayın.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Okul tatillerini elle yönetin',
  'help.guide.school-holiday-catalog.goal':
    "Bir ülkenin ya da bölgenin, herkesin Tatil'de seçebileceği okul tatillerini ekleyip güncel tutun.",
  'help.guide.school-holiday-catalog.step.1':
    '“Okul tatilleri” altında “Ülke”yi seç ya da + (“Ülke ekle”) düğmesine tıkla, “Ülke”yi ve “Ülke kodu (ör. US)”nu girip “Kaydet”e tıkla. “Bölge ekle”, kendi tarihleri olan her bölümü ekler.',
  'help.guide.school-holiday-catalog.step.2':
    '“Bölge veya okul bölgesi”ni açmak için bir bölgeye tıkla: “Tatil dönemi ekle”yi seç, her dönem için bir “Tatil adı”, “Başlangıç tarihi” ve “Bitiş tarihi” gir, sonra “Kaydet”e tıkla. Çöp kutusu bir dönemi ya da bir bölgeyi kaldırır; bir ülke, hiç bölgesi kalmadığında silinebilir.',
  'help.guide.school-holiday-catalog.result':
    'Kullanıcılar ülkeyi ve bölgeyi “Ayarlar”daki Tatil bölümünde bulur ve dönemleri yıl ızgarasında görür.',
  'help.guide.school-holiday-catalog.tip.1': 'Biri Tatil takviminde zaten seçmişse o bölge silinemez.',
  // auth-methods
  'help.guide.auth-methods.title': 'Oturum açma yöntemlerini belirleyin',
  'help.guide.auth-methods.goal':
    "Şifreyle oturum açmayı, SSO'yu ve kaydı açın ya da kapatın, ayrıca 2FA'yı zorunlu kılın.",
  'help.guide.auth-methods.step.1':
    "“Kimlik Doğrulama Yöntemleri” altında “Şifre Girişi” ve “Şifre Kaydı”nı aç veya kapat; her anahtar anında geçerli olur. Kayıt kapalıyken yeni hesaplar yalnızca davet bağlantılarından, SSO'dan veya “Kullanıcı Oluştur”dan gelir.",
  'help.guide.auth-methods.step.2':
    '“TOA Girişi” ve “SSO Otomatik Temel Hazırlığı”, aşağıda yapılandırılmış “Tek Oturum Açma (OIDC)” gerektirir. Otomatik hazırlık, biri SSO ile ilk kez oturum açtığında hesap oluşturur.',
  'help.guide.auth-methods.step.3':
    "İki faktörlü kimlik doğrulama (2FA) gerektir'i açarsanız, 2FA'sı olmayan herkes TREK'i kullanmadan önce Ayarlar'da 2FA kurmak zorunda kalır.",
  'help.guide.auth-methods.result': 'Oturum açma sayfasında yalnızca açık bıraktığınız yöntemler sunulur.',
  'help.guide.auth-methods.tip.1':
    'TREK son giriş yöntemini kapatmanıza izin vermez: anahtarı griye döner ve ipucunda En az bir giriş yöntemi açık kalmalıdır yazar.',
  'help.guide.auth-methods.tip.2':
    'Sunucuda OIDC_ONLY ayarlıysa şifreyle ilgili anahtarlar kilitlenir ve bir not bunu belirtir.',
  // oidc
  'help.guide.oidc.title': 'Tek oturum açmayı bağlayın',
  'help.guide.oidc.goal': 'İnsanların kimlik sağlayıcınızla oturum açmasını sağlayın.',
  'help.guide.oidc.step.1':
    "Tek Oturum Açma (OIDC) altında, düğme için Ekran Adı'nı, sağlayıcınızdan aldığınız Veren URL'sini, Müşteri Kimliği'ni ve Müşteri Sırrı'nı girin. Discovery URL (isteğe bağlı) alanını yalnızca sağlayıcınız onu olağan adreste yayımlamıyorsa doldurun, Authentik'te olduğu gibi. Sonra Kaydet'e tıklayın.",
  'help.guide.oidc.step.2': '“Kimlik Doğrulama Yöntemleri” altında “TOA Girişi”ni açın.',
  'help.guide.oidc.result':
    'Oturum açma sayfasında SSO düğmesi görünür. “SSO Otomatik Temel Hazırlığı” açıksa ilk kez giriş yapan kullanıcılar için hesap otomatik oluşturulur.',
  'help.guide.oidc.tip.1':
    "Sağlayıcınızın istediği yönlendirme URI'si, TREK adresiniz ile belgelerdeki OIDC geri çağırma yolunun birleşimidir.",
  'help.guide.oidc.tip.2':
    'Talep eşleme, hangi SSO gruplarının yönetici olacağını belirler. Belgelerdeki OIDC sayfasına bakın.',
  // instance-keys
  'help.guide.instance-keys.title': 'API anahtarlarını girin',
  'help.guide.instance-keys.goal':
    'Tüm kurulum için Google fotoğraflarını ve puanlarını, Unsplash kapaklarını ve Amap aramasını ekle.',
  'help.guide.instance-keys.step.1':
    '“API Anahtarları” altında en üstteki TREK Places API, anahtar olmadan da yer aramasını zaten karşılar. “İçinde ne var” neleri kapsadığını ve neleri kapsamadığını listeler.',
  'help.guide.instance-keys.step.2':
    'Fotoğraflar, puanlar ve çalışma saatleri için bir “Google Haritalar API Anahtarı” yapıştır ve “Test et”e tıkla; sonuç “Bağlı” ya da “Geçersiz” olarak görünür. “Anahtarın ne için kullanıldığı”nı aç ve yalnızca faturalandırılmasını istediklerini aç: “Fotoğrafları Yerleştir”, “Otomatik Tamamlamayı Yerleştir”, “Yer Detayları”, “Yer zenginleştirme” ve “Yalnızca Google ile ara”. Ayrıca Google çağrıları için “Günlük sınır” belirleyebilirsin.',
  'help.guide.instance-keys.step.3':
    "Kapak araması için “Unsplash API Anahtarı”nı, anakara Çin'inde yer araması için “Amap (高德地图) API Anahtarı”nı yapıştır, sonra kartın altındaki “Kaydet”e tıkla.",
  'help.guide.instance-keys.result':
    'Kullanıcılar kendi anahtarları olmadan da özellikleri kullanır. Google anahtarı yoksa arama TREK Places API ve OpenStreetMap üzerinden çalışır.',
  'help.guide.instance-keys.tip.1':
    'Bir kullanıcının “Ayarlar” altında kişisel anahtarı varsa TREK o kullanıcı için sunucu anahtarı yerine onu kullanır.',
  'help.guide.instance-keys.tip.2':
    'Anahtarlar ortam değişkenlerinden de gelebilir; bunlar burada salt okunur görünür.',
  'help.guide.instance-keys.tip.3':
    '“Google çağrıları için günlük sınır”, TREK’in anahtar için günde ne kadar harcayabileceğini sınırlar; başlığın yanındaki rozet bugünkü çağrıları sayar. Sınıra ulaşıldığında aramalar ertesi güne (UTC) kadar OpenStreetMap kullanır.',
  // places-transit
  'help.guide.places-transit.title': 'Arama ve toplu taşıma sağlayıcılarını seçin',
  'help.guide.places-transit.goal':
    'Yer aramalarını ve toplu taşıma rota isteklerini hangi hizmetin yanıtlayacağını seçin.',
  'help.guide.places-transit.step.1':
    "Toplu taşıma sağlayıcısı altında, anahtar gerektirmeyen ve Avrupa'da en güçlü olan Transitous (ücretsiz)'i ya da Google anahtarınızı kullanan Google'ı seçin. Seçim anında kaydedilir.",
  'help.guide.places-transit.step.2':
    "Yer arama sağlayıcısı altında, TREK dizini ve OpenStreetMap hiçbir şey bulamadığında TREK'in hangi hizmete soracağını seçin: Otomatik (anahtar varsa Google, sonra Amap), Google Places, Amap (高德地图) ya da OpenStreetMap.",
  'help.guide.places-transit.result': "TREK'teki her arama kutusu ve her toplu taşıma rotası bu seçimi kullanır.",
  'help.guide.places-transit.tip.1':
    "Anahtarı eksik bir seçimde burada uyarı görünür. Bu durumda yer arama yalnızca TREK dizinini ve OpenStreetMap'i, toplu taşıma ise yalnızca Transitous'u kullanır.",
  'help.guide.places-transit.tip.2':
    'Google toplu taşıma rotaları istek başına ücretlendirilir; Transitous ücretlendirilmez.',
  // file-types
  'help.guide.file-types.title': 'Dosya türlerini sınırlayın',
  'help.guide.file-types.goal': 'Yüklenen dosyaların hangi uzantılara sahip olabileceğine karar verin.',
  'help.guide.file-types.step.1':
    '“İzin Verilen Dosya Türleri” altında virgülle ayrılmış uzantı listesini düzenle ya da her türe izin vermek için * gir, sonra “Kaydet”e tıkla.',
  'help.guide.file-types.result':
    'Başka türdeki yüklemeler belgelerde, günlükte ve kapaklarda açık bir mesajla reddedilir.',
  'help.guide.file-types.tip.1':
    'Görsel türlerini listede tutun: kapaklar ve Journey fotoğrafları da aynı listeye göre denetlenir.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Bir eklentiyi açın ya da kapatın',
  'help.guide.toggle-addon.goal': 'Bir özellik modülünü herkes için kullanılabilir yapın ya da kaldırın.',
  'help.guide.toggle-addon.step.1':
    'Eklentinin kutucuğundaki anahtara tıklayın. Gezinme menüsündeki girdi herkes için hemen görünür ya da kaybolur.',
  'help.guide.toggle-addon.step.2':
    'Bazı kutucuklarda seçenekleri için alt satırlar bulunur; örneğin “Listeler” altındaki “Çanta Takibi” ya da “Seyahat” altındaki fotoğraf sağlayıcıları. Bunlar yalnızca eklenti açıkken görünür.',
  'help.guide.toggle-addon.result':
    'Bir eklentiyi kapattığınızda verileri korunur. Yeniden açtığınızda veriler yeniden görünür.',
  'help.guide.toggle-addon.tip.1': 'MCP’yi kapatmak uç noktayı ve ona bağlı “Entegrasyonlar” bölümlerini kaldırır.',
  'help.guide.toggle-addon.tip.2':
    'Tatil, Atlas ve Journey kullanıcıların en çok istediği eklentilerdir. Belgeler eklentisi yüklemeler için depolama alanı gerektirir.',
  // install-plugin
  'help.guide.install-plugin.title': 'Eklenti kurun',
  'help.guide.install-plugin.goal': 'Üçüncü taraf bir eklenti ekleyin ve ona yalnızca istediği izinleri verin.',
  'help.guide.install-plugin.step.1':
    '“Keşfet”i aç, “Eklenti ara…” ile veya “Tür” filtresiyle bir eklenti bul ve “Yükle”ye tıkla. Paket dosyası için “Eklenti yükle”ye (kartın sağ üstündeki bulut simgesi) tıkla ya da .zip dosyasını sayfaya bırak.',
  'help.guide.install-plugin.step.2':
    '“Yüklü” altında satırı oku: eklentinin nelere erişebildiği, bağlandığı sunucular ve “İncelendi” ile “İmzalı” olup olmadığı. Sonra “Eklentiyi etkinleştir”i aç; satırda “Aktif” yazar.',
  'help.guide.install-plugin.step.3':
    'Satırın ⋯ menüsünde “Yeniden başlat”, “Hata günlüğünü görüntüle”, “İzin verilen ana bilgisayarlar”, “Sürüm değiştir…” ve kaynağa giden bağlantılar bulunur; “Sil” eklentiyi ve verilerini kaldırır. Daha yeni bir sürüm satırda güncelleme olarak görünür; yeni izinler isteyen sürüm sen onaylayana kadar kapalı kalır.',
  'help.guide.install-plugin.result':
    'Plugin kendi işleminde çalışır. Eklediği her şey, örneğin bileşenler, harita katmanları ya da araçlar, plugin’in belirlediği yerde görünür.',
  'help.guide.install-plugin.tip.1':
    '“Yeniden tara”, geliştirme için bağlanmış ve paketi olmayan bir plugin klasörünü bulur.',
  'help.guide.install-plugin.tip.2':
    'İmzasız bir plugin bu şekilde işaretlenir; yalnızca kaynağına güveniyorsanız yükleyin.',
  // storage-backends
  'help.guide.storage-backends.title': "Yüklemeleri S3'e taşıyın ya da yansıtın",
  'help.guide.storage-backends.goal':
    'Dosyaları nesne depolamada tutun ya da her yüklemeyi ikinci bir depolama birimine kopyalayın.',
  'help.guide.storage-backends.step.1':
    "Arka uçlar altında Arka uç ekle'ye tıklayın, ona bir Ad verin, Tür olarak Yerel ya da S3'ü seçin ve alanlarını doldurun. Bir kopyayı başka bir yerde de tutmak için Ayna hedefleri'ni işaretleyin. Uygula'ya, ardından bağlantıyı denemek için yeni satırdaki Test et'e tıklayın.",
  'help.guide.storage-backends.step.2':
    'Kategoriler altında her yükleme türünü, örneğin Seyahat belgeleri, Seyahat fotoğrafları ya da Yedekler, bir arka uca atayın.',
  'help.guide.storage-backends.step.3':
    'En alttaki “Değişiklikleri kaydet”e tıkla. Bir kategori artık başka bir yeri gösteriyorsa TREK, “Mevcut nesneleri taşı” mı yoksa “Yalnızca yeni yazmaları yönlendir” mi diye sorar.',
  'help.guide.storage-backends.result':
    'Yeni yüklemeler atanan arka uca gider. Taşınan dosyalar da oradan sunulur; taşımamayı seçtiklerin olduğu yerde kalır.',
  'help.guide.storage-backends.tip.1':
    'Ortam değişkenleriyle yapılandırılmış bir depolama arka ucu gösterilir ama burada düzenlenemez.',
  'help.guide.storage-backends.tip.2':
    'Ayna hedefi her yeni yazmanın bir kopyasını alır; satırdaki “Şimdi eşitle” daha önce kaydedilenleri kopyalar. Yavaş bir hedef, o arka uçtaki her yüklemeyi yavaşlatır.',
  // channels-instance
  'help.guide.channels-instance.title': 'Bildirim kanallarını yapılandırın',
  'help.guide.channels-instance.goal':
    'Kullanıcıların hangi kanalları seçebileceğine karar verin ve e-postayı yapılandırın.',
  'help.guide.channels-instance.step.1':
    "Kartının başlığında E-posta (SMTP)'yi açın, SMTP Host, SMTP Port, SMTP User, SMTP Password ve From Address alanlarını doldurun, sonra Kaydet'e tıklayın. Test e-postası gönder size bir e-posta yollar. TLS sertifika denetimini atla yalnızca kendi sertifikasını kullanan yerel bir posta sunucusu içindir.",
  'help.guide.channels-instance.step.2':
    "Kullanıcılara sunmak için Webhook, Ntfy ve Web anlık bildirimleri'ni açın. Kullanıcılar sonra Ayarlar, Bildirimler bölümünde kendi URL'lerini ya da konularını girer veya anlık bildirimi cihaz başına açar.",
  'help.guide.channels-instance.step.3':
    'Seyahat Hatırlatıcıları, seyahat başlamadan önceki hatırlatıcıyı açar. Uygulama içi her zaman açıktır.',
  'help.guide.channels-instance.result': 'Her kullanıcının Bildirimler sekmesinde, açtığınız kanallar görünür.',
  'help.guide.channels-instance.tip.1':
    "“Yönetici Ntfy” kartındaki “Ntfy Sunucu URL'si”, kullanıcılar için de varsayılan sunucudur. Kullanıcılar yine de kendi sunucularını belirleyebilir.",
  'help.guide.channels-instance.tip.2':
    'Plugin kanalları, bu özelliğe sahip bir plugin etkinleştirildiğinde otomatik olarak görünür.',
  // admin-channels
  'help.guide.admin-channels.title': 'Yönetici olaylarını telefonunuza alın',
  'help.guide.admin-channels.goal':
    'Yeni sürümlerden, başarısız depolama aynalarından ve kürek bölgesi isteklerinden haberdar ol.',
  'help.guide.admin-channels.step.1':
    "“Yönetici Ntfy” altında “Yönetici Konusu”nu, gerekirse “Ntfy Sunucu URL'si”ni ve “Erişim anahtarı (isteğe bağlı)”nı gir; “Yönetici Webhook” altına bir URL gir. Her kartta “Kaydet”e tıkla.",
  'help.guide.admin-channels.step.2':
    'Bir mesajın geldiğini görmek için “Test ntfy gönder”e ya da “Test webhook gönder”e tıklayın.',
  'help.guide.admin-channels.result':
    'Yönetici olayları uygulamada her yöneticiye gönderilir; açtığınız yerlerde yönetici ntfy konusuna ve web kancasına da gider.',
  'help.guide.admin-channels.tip.1':
    'Yönetici konusunu kişisel konunuzdan ayrı tutun; böylece kesinti mesajları seyahat mesajlarının arasında kaybolmaz.',
  'help.guide.admin-channels.tip.2':
    'Yönetici web kancası ve konusu, Ayarlar, Bildirimler altındaki kendi kanallarınızdan ayrıdır.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Yapay zekâ erişimini iptal edin',
  'help.guide.mcp-tokens-admin.goal':
    'Bir yapay zekâ istemcisinin elindeki tüm belirteçleri ve oturumları, herhangi bir kullanıcı için görün ve iptal edin.',
  'help.guide.mcp-tokens-admin.step.1':
    'OAuth Oturumları altında istemciyi adından ve sahibinden bulun. Etiketleri ona verilen kapsamları gösterir. Çöp kutusu, onayınızdan sonra oturumu iptal eder.',
  'help.guide.mcp-tokens-admin.step.2':
    'API Belirteçleri altında belirteçler için de aynısı geçerlidir: ad, sahibi, Oluşturulma ve Son Kullanılan. Çöp kutusu belirteci siler ve istemci hemen çalışmayı bırakır.',
  'help.guide.mcp-tokens-admin.result':
    'İstemciyi kullanan kişinin yeniden bağlanması gerekir. Başka hiçbir şey değişmez.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Kapsamlar, bir istemcinin neler yapabileceğini gösterir; salt okunur bir kapsamı bırakmakta sakınca yoktur.',
  'help.guide.mcp-tokens-admin.tip.2':
    'MCP eklentisini kapatmak tüm istemcileri anında durdurur ve bu sekmeyi gizler, ama hiçbir şeyi silmez: eklenti yeniden açılınca belirteçler yine çalışır.',
  // release-history
  'help.guide.release-history.title': 'Yeni sürüm olup olmadığına bakın',
  'help.guide.release-history.goal': 'TREK’inizin güncel olup olmadığını ve sonraki sürümün neler getirdiğini öğrenin.',
  'help.guide.release-history.step.1':
    "Daha yeni bir sürüm çıktığında sayfa başlığının altında, çalıştırdığın sürümle birlikte “Güncelleme mevcut” görünür. “GitHub'da görüntüle” sürümü açar, “Nasıl Güncellenir?” ise Docker için komutları, diğer kurulumlar için güncelleme kılavuzunu gösterir.",
  'help.guide.release-history.step.2':
    '“Sürüm Geçmişi” her sürümü notlarıyla listeler. “Ayrıntıları göster” notları genişletir, en yeni sürümde “En sonuncu” etiketi bulunur ve “Daha fazlasını yükle” eski sürümleri gösterir.',
  'help.guide.release-history.result':
    'Güncellemeyi ana makinede yaparsınız: yeni imajı çeker ya da yeni etiketi derlersiniz. Veri dizini korunur.',
  'help.guide.release-history.tip.1': 'Güncellemeden önce yedek alın. “Yedekleme” sekmesi bunun hemen yanındadır.',
  'help.guide.release-history.tip.2':
    'Ön sürümler gösterilir ama siz bir ön sürüm kullanmıyorsanız güncelleme olarak duyurulmaz.',
  // create-backup
  'help.guide.create-backup.title': 'Yedek alın ve geri yükleyin',
  'help.guide.create-backup.goal':
    'Tüm sunucunun yedeğini alın, bir kopyasını başka bir yerde saklayın ve gerektiğinde geri yükleyebilin.',
  'help.guide.create-backup.step.1':
    '“Veri Yedekleme” altında sağ üstteki “Yedek Oluştur”a tıkla. Veritabanını ve yüklemeleri sunucuda tek bir dosyaya kaydeder.',
  'help.guide.create-backup.step.2':
    '“İndir” bir kopyayı bu makinenin dışında tutar; çöp kutusu, onayından sonra eski yedekleri siler.',
  'help.guide.create-backup.step.3':
    "Bir yedekte Geri yükle'ye ya da bir dosyayla Yedek Yükle'ye tıkladıktan sonra Yedek geri yüklensin mi? altında Evet, geri yükle'ye tıklarsanız tüm mevcut veriler değiştirilir.",
  'help.guide.create-backup.result':
    'Geri yükleme; kullanıcıları, seyahatleri, dosyaları ve ayarları o yedekteki haliyle aynen geri getirir.',
  'help.guide.create-backup.tip.1': 'Geri yükleme, burada geri alınamayan tek işlemdir. Önce yeni bir yedek alın.',
  'help.guide.create-backup.tip.2':
    'Yedekler veri dizininde saklanır. Bu makine bozulursa güvende olmaları için onları başka bir makineye kopyalayın.',
  // auto-backup
  'help.guide.auto-backup.title': 'Yedeklemeleri zamanlayın',
  'help.guide.auto-backup.goal': 'Sunucunun kendini yedeklemesini ve eski yedekleri temizlemesini sağlayın.',
  'help.guide.auto-backup.step.1':
    "Otomatik yedekleme altında Otomatik yedeklemeyi etkinleştir'i açın ve Aralık'ı (Saatlik, Günlük, Haftalık ya da Aylık), Çalışma saati'ni, haftalık veya aylık yedekte de Haftanın günü ya da Ayın günü'nü seçin.",
  'help.guide.auto-backup.step.2':
    '“Eski yedekleri şu süreden sonra sil” altında bir yedeğin ne kadar saklanacağını “1 gün” ile “Sonsuza kadar sakla” arasından seç ve “Kaydet”e tıkla.',
  'help.guide.auto-backup.result': 'Yedekler zamanlamaya göre listede belirir. Seçtiğin süreden eski yedekler silinir.',
  'help.guide.auto-backup.tip.1':
    '“Çalışma saati” sunucunun saatini kullanır; altındaki ipucu sunucunun saat dilimini gösterir.',
  'help.guide.auto-backup.tip.2':
    'Sunucudaki depolama alanı sınırlıdır: genellikle 7 veya 14 gün yeterlidir; indirdiğin bir kopyayı başka bir yerde sakla.',
  // audit-log
  'help.guide.audit-log.title': 'Denetim günlüğünü okuyun',
  'help.guide.audit-log.goal': 'Kimin neyi ne zaman yaptığını öğrenin.',
  'help.guide.audit-log.step.1':
    'Satırları en yeniden eskiye doğru okuyun: Zaman, Kullanıcı, Aksiyon, Kaynak, IP ve Detaylar. Aksiyonlar, başarısız bir giriş, MFA değişikliği ya da geri yükleme gibi, olanın adıyla anılır.',
  'help.guide.audit-log.step.2':
    'Sağ üstteki Yenile listeyi yeniden yükler. Başlığın yanındaki rozet, toplam kayıttan kaçının yüklendiğini gösterir; Daha fazlasını yükle daha eski kayıtları getirir.',
  'help.guide.audit-log.result': 'Bir şeyin neden değiştiğini soran herkese gösterebileceğiniz bir kaydınız olur.',
  'help.guide.audit-log.tip.1': 'Zamanlar sunucunun saat diliminde gösterilir.',
  'help.guide.audit-log.tip.2':
    'Günlük yalnızca eklenir; buradaki hiçbir şey uygulamadan düzenlenemez ya da silinemez.',
  // document-providers
  'help.guide.document-providers.title': 'Bir belge deposu sunun',
  'help.guide.document-providers.goal': 'Bir seyahatin belgelerini hangi depolarla eşitleyebileceğine karar verin.',
  'help.guide.document-providers.step.1':
    '“Belgeler” kutucuğunda depolar satır olarak listelenir: Paperless-ngx, Papra, Nextcloud, OpenCloud ve Synology Drive. Beşi de başlangıçta kapalıdır ve bu satırlar yalnızca “Belgeler” açıkken görünür.',
  'help.guide.document-providers.step.2':
    'Nextcloud satırındaki anahtarı açın. “Eklenti güncellendi” mesajı görünür; bundan sonra seyahat sahipleri seyahatlerinin “Dosyalar” sekmesinde “Belge eşitleme”yi, “Sağlayıcı bağla” altında da Nextcloud’u bulur.',
  'help.guide.document-providers.result':
    'Depo bu TREK’teki her seyahatte kullanılabilir. Bir seyahat sahibi bağlayana kadar hiçbir şey bağlı değildir.',
  'help.guide.document-providers.tip.1':
    'Burada yalnızca bir deponun sunulup sunulmayacağına karar verilir. Adres ve kimlik bilgileri bir seyahate aittir ve seyahatin sahibi tarafından “Dosyalar” sekmesinde girilir; yönetici panelinde asla girilmez.',
  'help.guide.document-providers.tip.2':
    "Belgeler'i kapatırsanız tüm depolar da kapanır ve Belgeler kapalıyken bir depoyu açamazsınız: sunucu “Enable the Documents addon first” yanıtını verir. Kendi ağınızdaki bir depo için ayrıca sunucuda ALLOW_INTERNAL_NETWORK=true ayarı gerekir.",

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Seyahat',
  'help.ctx.trip.summary':
    'Tek bir seyahatle ilgili her şey: günleri, haritası ve yerleriyle plan; turlar, ulaşım, rezervasyonlar, listeler, maliyetler, dosyalar, iş birliği ve bağlı bir günlük için sekmeler. Bunların her birinin bu ekranın altında kendi yardım ekranı var.',
  'help.ctx.trip.bullet.1':
    "Üst çubuğun altındaki sekme çubuğu: Plan, Turlar, Ulaşım, Rezervasyonlar, Listeler, Maliyetler, Dosya, İş birliği ve bir günlük bağlandıktan sonra Günlük. Hangi sekmelerin bulunacağını TREK'inizdeki eklentiler belirler.",
  'help.ctx.trip.bullet.2':
    'Plan üç sütundan oluşur: solda günler, ortada harita, sağda yerler. Yol gezisi eklentisiyle gün sütunu bir Gün ve Yol gezisi anahtarıyla, Turlar eklentisiyle yer sütunu Yer ve Turlar anahtarıyla başlar. Rezervasyonlar ve ulaşım planın içindedir, yani durakta ve duraklar arasında yer alır. Sekmeler bunları listeler.',
  'help.ctx.trip.bullet.3':
    'Seyahatin adının sol üstündeki Seyahat ayarları etiketi, seyahatin ayarlarını açar: Kişiler (üyeler ve misafirler), Paylaşma (salt okunur herkese açık bağlantı ve davet bağlantısı) ve Günlük.',
  'help.ctx.trip.bullet.4':
    "Başlık, tarihler, kapak ve para birimi, seyahat kartındaki kalemle Seyahatlerim'den düzenlenir. Sol üstteki seyahat adına tıklarsanız oraya geri dönersiniz.",
  'help.ctx.trip.bullet.5':
    'Bir sütunun iç kenarındaki sekme sütunu daraltır ve harita boşalan alanı kullanır. Daraltılmış sütun, haritanın üst köşesinde küçük bir kutucuk olarak görünür; sütunu yeniden göstermek için ona tıkla. Bir sütunun genişliğini değiştirmek için yanındaki ince ayırıcıyı sürükle.',
  'help.ctx.trip.bullet.6':
    'Gün sütununun araç çubuğundaki geri alma oku, plandaki son değişikliklerini birer birer geri alır.',
  // add-member
  'help.guide.add-member.title': 'Üye ekleyin',
  'help.guide.add-member.goal': 'TREK hesabı olan birine bu seyahate erişim verin.',
  'help.guide.add-member.step.1':
    'Sol üstte seyahatin adının yanındaki etiket olan “Seyahat ayarları”na tıkla. “Kişiler” sekmesinde açılır.',
  'help.guide.add-member.step.2':
    '“Kullanıcı davet et” altında “Kullanıcı seç…” alanından kişiyi seç ve “Davet et”e tıkla.',
  'help.guide.add-member.step.3':
    'Kişi artık Erişim altında görünür. Mal sahibi rozeti seyahatin sahibini gösterir. Satırın sonundaki Erişimi kaldır, onayınızdan sonra kişiyi çıkarır.',
  'help.guide.add-member.result':
    'Üye, seyahati sizin gibi görebilir ve düzenleyebilir; yöneticinin “İzin Ayarları” altında belirlediği seviyelere göre.',
  'help.guide.add-member.tip.1':
    'Listede olmayan kişinin henüz TREK hesabı yoktur: onu misafir olarak ekleyin ya da davet bağlantısıyla kaydolmasını sağlayın.',
  'help.guide.add-member.tip.2':
    '“Erişim” yanındaki sayı seyahatteki kişileri sayar; misafirler altta ayrıca listelenir.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Bağlantıyla davet edin',
  'help.guide.trip-invite-link.goal': 'İnsanların seyahate kendilerinin katılmasına izin verin.',
  'help.guide.trip-invite-link.step.1':
    "Seyahatin adının yanındaki Seyahat ayarları'na tıklayın ve solda Paylaşma'yı seçin. Seyahat davet bağlantısı altında Davet bağlantısı oluştur'a tıklayın.",
  'help.guide.trip-invite-link.step.2':
    '“Kopyala”ya tıklayın ve bağlantıyı gönderin. Bağlantıyı açan TREK hesabı olan herkes üye olarak katılır.',
  'help.guide.trip-invite-link.step.3':
    '“Yeniden oluştur” bağlantıyı yeniler ve eski bağlantı çalışmaz hale gelir. “Devre dışı bırak” bağlantıyı kapatır.',
  'help.guide.trip-invite-link.result': 'Bağlantıyı açan herkes seyahate katılır ve “Erişim” altında listelenir.',
  'help.guide.trip-invite-link.tip.1':
    'Hesabı olmayan biri bu bağlantıyı kullanamaz. Yönetici, kayıt bağlantılarını Yönetici, Kullanıcılar altında oluşturur ve birini bu seyahate bağlayabilir.',
  'help.guide.trip-invite-link.tip.2':
    'Bağlantıyı yanlış sohbete gönderdiyseniz “Yeniden oluştur”a tıklayın: eski bağlantı hemen çalışmayı bırakır.',
  // add-guest
  'help.guide.add-guest.title': 'Hesabı olmayan bir misafir ekleyin',
  'help.guide.add-guest.goal': 'TREK kullanmayan birini seyahate ekleyin.',
  'help.guide.add-guest.step.1':
    "Seyahatin adının yanındaki Seyahat ayarları'na tıklayın. Kişiler sayfasında Misafirler, Erişim altındaki son bölümdür.",
  'help.guide.add-guest.step.2': 'Adı “Misafir adı” alanına yazın ve “Misafir ekle”ye tıklayın.',
  'help.guide.add-guest.result': 'Misafir maliyetlere, paketleme öğelerine ve görevlere atanabilir ama oturum açamaz.',
  'help.guide.add-guest.tip.1':
    'Yeniden adlandır (kalem) misafirin adını değiştirir. Erişimi kaldır (çöp kutusu), onayınızdan sonra misafiri çıkarır: atamaları silinir ve her harcamadaki payı, o harcamanın paylaşımındaki diğer kişilere dağıtılır.',
  'help.guide.add-guest.tip.2': 'Kişi sonradan hesap açarsa onu üye olarak davet edin ve misafiri kaldırın.',
  // public-link
  'help.guide.public-link.title': 'Salt okunur bağlantı yayınlayın',
  'help.guide.public-link.goal': 'Seyahati düzenlememesi gereken kişilere gösterin.',
  'help.guide.public-link.step.1': 'Seyahatin adının yanındaki “Seyahat ayarları”na tıkla ve solda “Paylaşma”yı seç.',
  'help.guide.public-link.step.2':
    '“Genel Bağlantı” kartında bağlantının neleri gösterebileceğini aç. “Harita ve Plan” her zaman açıktır; “Rezervasyonlar”, “Ambalaj”, “Maliyetler” ve “Sohbet” sana kalmış.',
  'help.guide.public-link.step.3':
    '“Seçenekler” altında “Yalnızca ulaşım ve konaklama” etkinlikleri, gün notlarını ve boş günleri dışarıda bırakır. “Fotoğrafsız” yer fotoğraflarını dışarıda bırakır.',
  'help.guide.public-link.result':
    'Bağlantıya sahip herkes seçilen bölümleri oturum açmadan görür ve hiçbir şeyi değiştiremez.',
  'help.guide.public-link.tip.1':
    'Bağlantı hiçbir yerde listelenmez, ama elinde olan herkes onu açabilir. Bir şifre kadar gizli tutun.',
  'help.guide.public-link.tip.2': 'Düzenleme hakkı vermek için kişiyi bunun yerine üye olarak ekleyin.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Seyahati devredin ya da seyahatten ayrılın',
  'help.guide.transfer-ownership.goal': 'Seyahatin sahibini değiştirin ya da size ait olmayan bir seyahatten ayrılın.',
  'help.guide.transfer-ownership.step.1':
    "Seyahatin adının yanındaki Seyahat ayarları'na tıklayın. Erişim altında bir üyenin satırındaki Sahip yap'a (taç simgesi) tıklayın ve onaylayın.",
  'help.guide.transfer-ownership.step.2':
    'Kendi satırındaki “Seyahatten ayrıl”, onayından sonra seni seyahatten çıkarır. Seyahatin sahibiysen önce sahipliği devret.',
  'help.guide.transfer-ownership.result':
    'Yeni sahip üyeleri yönetir ve seyahati silebilir. Siz sıradan bir üye olarak kalırsınız.',
  'help.guide.transfer-ownership.tip.1':
    'Sahiplik devredilene kadar sahip, seyahati oluşturan kişidir. Seyahati yalnızca sahibi silebilir.',
  'help.guide.transfer-ownership.tip.2':
    'Başka bir üyenin satırındaki “Erişimi kaldır” ise ters yönde çalışır: sahip o üyeyi seyahatten çıkarır.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Haritaya yer açın',
  'help.guide.collapse-columns.goal': 'Bir sütunu daraltın ya da genişletin.',
  'help.guide.collapse-columns.step.1':
    'Sütunu daraltmak için günler sütununun iç kenarındaki, panel simgeli sekmeye tıklayın. Boşalan alanı harita kullanır. Yerler sütununda da aynı sekme vardır.',
  'help.guide.collapse-columns.step.2':
    'Daraltılmış sütun, haritanın üst köşesinde panel simgeli küçük bir kutucuk olarak görünür; ipucunda “Plan” veya “Yer” yazar. Sütunu yeniden göstermek için ona tıkla.',
  'help.guide.collapse-columns.step.3':
    'Bir sütunun genişliğini değiştirmek için sütunla harita arasındaki ince ayırıcıyı sürükleyin.',
  'help.guide.collapse-columns.result':
    'Genişlikler hatırlanır. Sütunlar bir sonraki ziyaretinizde yeniden açık gelir.',
  'help.guide.collapse-columns.tip.1': 'İki sütunu da aynı anda daraltıp yalnızca haritayı görebilirsiniz.',
  'help.guide.collapse-columns.tip.2':
    'Dar bir pencerede yalnızca bir sütun sığar: birini açmak diğerini kapatır. Telefonda sütun yoktur; üstteki Seyahat, Plan ve Yer görünümler arasında geçiş yapar.',
  // undo-change
  'help.guide.undo-change.title': 'Son değişikliği geri alın',
  'help.guide.undo-change.goal': 'Plandaki son değişikliğinizi geri alın.',
  'help.guide.undo-change.step.1':
    'Günlerin üstündeki araç çubuğunda geri alma okuna tıklayın. İpucu, geri alacağı değişikliğin adını gösterir.',
  'help.guide.undo-change.result': 'Plan eski haline döner ve kısa bir ileti nelerin geri alındığını söyler.',
  'help.guide.undo-change.tip.1':
    'Geri al, planla ilgili işlemleri kapsar: yer ekleme, atama, kaldırma, yeniden sıralama, taşıma ve kilitleme, bir günü temizleme, rotayı optimize etme, yer silme, kategori değişiklikleri ve içe aktarmalar.',
  'help.guide.undo-change.tip.2':
    'Daha geriye gitmek için tekrar tıkla: TREK bu seyahatteki son 30 değişikliğini, en yenisi başta, sen seyahatten çıkana kadar saklar.',
  'help.guide.clear-day.title': 'Bir günü temizleyin',
  'help.guide.clear-day.goal': 'Bir gündeki tüm yerleri tek seferde kaldırın; örneğin günü baştan planlamak için.',
  'help.guide.clear-day.step.1': 'Plandaki günün başlığına sağ tıklayın.',
  'help.guide.clear-day.step.2': '“Günü temizle”yi seçin ve onaylayın.',
  'help.guide.clear-day.result':
    'Gün boşalır ve yerleri planlanmamış olarak listeye geri döner. Günlerin üstündeki geri alma oku onları geri getirir.',
  'help.guide.clear-day.tip.1': 'Yalnızca yerler kaldırılır. Günün notları ve rezervasyonları kalır.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Yerler',
  'help.ctx.trip-places.summary':
    'Planın sağ sütunu: seyahatin planlanmış ya da planlanmamış tüm yerleri; arama, filtreler ve sıralama ile yer eklemenin yolları: arama ile, elle ya da paylaşılan bir listeden. Üstteki “Yer” ve “Turlar”, yerler ile seyahatin turları arasında geçiş yapar.',
  'help.ctx.trip-places.bullet.1':
    'Sütunun üstündeki “Yer” ve “Turlar” listeyi değiştirir. Sayfaya geldiğinde “Yer” açıktır. “Turlar” seyahatin turlarını listeler ve “GPX veya KML içe aktar” ile GPX, KML ve KMZ dosyalarını içe aktarır; tur, yerler listesinde görünmez.',
  'help.ctx.trip-places.bullet.2':
    '“Yer/etkinlik Ekle”, aradığın ya da elle yazdığın bir yer için formu açar. Bir gün açıkken düğmede “Yeni yer” yazar; yanındaki “Güne” yeri doğrudan o günde oluşturur.',
  'help.ctx.trip-places.bullet.3':
    "Yerleri İçe Aktar, yanındaki simge düğmesidir; Google Haritalar ya da Naver Maps'ten paylaşılan bir liste için Liste İçe Aktarma sunar. Yönetici Turlar eklentisini kapatmışsa .gpx, .kml ve .kmz dosyaları için Dosyayı içe aktar da sunar; ayrıca bir dosyayı sütunun üzerine bırakabilirsiniz.",
  'help.ctx.trip-places.bullet.4':
    'Bunların altında, açıklamalarda ve notlarda da arayan Ara alanı ve yanında Seç onay kutusu bulunur. Onun altındaki satırda filtreler yer alır: Göster, her biri sayısıyla Tümü, Planlanmamış ve Planlandı arasında geçiş yapar. Etiket düğmesi kategoriye, yıldız asgari puana, küre simgesi (seyahat birden fazla ülke ya da bölgeyi kapsıyorsa) ülkeye ya da bölgeye göre filtreler. Sırala listenin sırasını belirler.',
  'help.ctx.trip-places.bullet.5':
    "Bir satırda resim, ad ve açıklama ya da adres görünür; biri yeri puanladıysa ortalama puanıyla bir yıldız da. Yerin ayrıntıları için satıra tıklayın, bir güne sürükleyin ya da sağ tıklayın (veya üç nokta olan Diğer seçenekler'e tıklayın): Düzenle, + Gün, Web Sitesini Aç, Google Haritalar'da aç, Koleksiyona kaydet ve Sil.",
  'help.ctx.trip-places.bullet.6':
    'Bir gün açıkken satırın sonundaki yuvarlak + (+ Gün) yeri o güne ekler. Bu simge, o güne henüz eklenmemiş her yerde görünür. Planlandı filtresi de yalnızca o günü listeler ve Yalnızca açık gün gösteriliyor etiketi bunu belirtir. Etiketteki x (Tüm yolculuğu göster) günü kapatır.',
  // create-place
  'help.guide.create-place.title': 'Yer oluşturun',
  'help.guide.create-place.goal': 'Planın ihtiyaç duyduğu tüm ayrıntılarla bir yer ya da etkinliği elle ekleyin.',
  'help.guide.create-place.step.1':
    'Yerler sütununun üstündeki “Yer/etkinlik Ekle”ye tıkla (bir gün açıkken “Yeni yer”). Form, imleç aramada olacak şekilde açılır.',
  'help.guide.create-place.step.2':
    "Yeri “Yer ara…” alanına yaz ve bir sonuç seç. Pencere başlığındaki ad, “Adres”, “Enlem”, “Boylam” ve “Web sitesi” otomatik dolar; soldaki “Yer ayrıntıları” resimleri, çalışma saatlerini ve bir açıklamayı gösterir. Google anahtarı olan bir TREK'te sonuçların altındaki “Doğru yer değil mi? Google'da ara” aynı aramayı Google üzerinden yapar. “Koleksiyonlar” açıksa sağdaki “Kaydedilen yerler”, listelerindeki yerleri aynı şekilde sunar.",
  'help.guide.create-place.step.3':
    'Yer ayrıntıları içinde, Bir görsel seç altındaki bir resme tıklayarak onu yerin görseli yapın. Bu metni kullan, açıklamayı forma kopyalar.',
  'help.guide.create-place.step.4':
    'Formdaki alanları kontrol edin. Pencerenin başındaki ad tek zorunlu alandır. Altındaki Kategori etiketi seyahatin kategorilerinden birini seçer, yanındaki + yeni bir kategori oluşturur. Adres, Enlem ve Boylam aramadan gelir ya da elle yazarsınız. Açıklama ve Notlar kendi metinleriniz içindir. Web sitesi alanına bağlantı girilir, Dosya altındaki Ekle bir belge ekler. Telefon, E-posta ve Çalışma saatleri ekle ise aramanın bulamadığı bilgiler içindir.',
  'help.guide.create-place.step.5':
    '“Ekle”ye tıklayın. Seyahatte aynı ada sahip ya da aynı konumda bir yer zaten varsa TREK uyarı gösterir ve düğme “Yine de ekle” olur.',
  'help.guide.create-place.result': 'Yer listede ve haritadadır; bir güne eklenene kadar “Planlanmamış” altında durur.',
  'help.guide.create-place.tip.1':
    'Bütçe eklentisi açıkken formun altındaki Maliyetler, kaydettikten hemen sonra yerin gideri için Maliyetler düzenleyicisini açar. Pencereye yapıştırılan bir resim ya da PDF, Dosya altındaki bir dosya gibi eklenir.',
  'help.guide.create-place.tip.2':
    'Her TREK’te arama sonuçlarını TREK dizini ve OpenStreetMap sağlar; “Yer ayrıntıları” da Wikipedia, Wikivoyage ve Wikimedia’dan otomatik doldurulur. TREK, Google’a yalnızca ikisi de sonuç bulamazsa sorar ve puanları yalnızca Google sağlar.',
  'help.guide.create-place.tip.3':
    'Haritada da yer oluşturabilirsiniz: noktaya sağ tıklayın, form koordinatlar ve adres doldurulmuş olarak açılır.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Bir yeri doğrudan açık güne ekleyin',
  'help.guide.place-to-open-day.goal': 'Bir yer oluşturun ya da seçin ve tek adımda güne ekleyin.',
  'help.guide.place-to-open-day.step.1':
    'Gün sütununda bir günün başlığına tıkla. Gün açılır: kartı vurgulanır ve yerler sütununda “Yeni yer”in yanında “Güne” düğmesi belirir.',
  'help.guide.place-to-open-day.step.2':
    '“Güne”, “Yeni yer” ile aynı formu açar, ama yer “Ekle”ye tıkladığın anda açık güne eklenir.',
  'help.guide.place-to-open-day.step.3':
    'Zaten var olan bir yeri açık güne eklemek için satırının sonundaki yuvarlak + işaretine (+ Gün) tıkla ya da satıra sağ tıklayıp “+ Gün”ü seç. + işareti, o günde henüz olmayan her yerde görünür.',
  'help.guide.place-to-open-day.step.4':
    'Ters yönde de çalışır ve önce bir gün açmana gerek kalmaz: yerin satırını sütundan sürükleyip bir gün kartına bırak. İki durağın arasına bırakırsan tam oraya yerleşir.',
  'help.guide.place-to-open-day.result':
    'Yer günün altında, en sonda listelenir. Ait olduğu yere yukarı ya da aşağı sürükleyin.',
  'help.guide.place-to-open-day.tip.1':
    'Açık gün aramayı da etkiler: bir gün açıkken harita ve yakındaki yerler araması, o güne eklenmiş yerlerden başlar.',
  'help.guide.place-to-open-day.tip.2': 'Günlerin üstündeki araç çubuğundaki “Geri al” atamayı geri alır.',
  // filter-places
  'help.guide.filter-places.title': 'Listede bir yer bulun',
  'help.guide.filter-places.goal': 'Sütunda yalnızca aradığınız yerleri gösterin.',
  'help.guide.filter-places.step.1':
    'Aramanın altındaki Göster açılır listesi, her biri sayısıyla Tümü, Planlanmamış (henüz hiçbir günde olmayanlar) ve Planlandı (bir günde olanlar) arasında geçiş yapar. Turlar eklentisi kapalıysa ve bir GPX izi içe aktarılmışsa listede İzler de bulunur.',
  'help.guide.filter-places.step.2':
    'Üstteki Ara alanına yazın. Liste yazdıkça ada, adrese, açıklamaya ve notlara göre daralır. Alandaki x onu temizler.',
  'help.guide.filter-places.step.3':
    "Göster'in yanındaki etiket düğmesi kategorileri listeler: bir ya da daha fazlasını işaretleyin, Kategori Yok da bunların arasındadır. Düğme kaç kategorinin işaretli olduğunu gösterir, listenin altındaki Filtreyi temizle hepsini kaldırır.",
  'help.guide.filter-places.step.4':
    'Yanındaki yıldız, asgari puanı belirler: 5+, 4+ gibi seçimler yalnızca ortalama puanı en az o kadar olan yerleri bırakır. Puanı olmayan yerler gizlenir.',
  'help.guide.filter-places.result':
    '“Göster” üzerindeki sayı kaç yerin eşleştiğini gösterir ve filtreler birlikte uygulanır.',
  'help.guide.filter-places.tip.1':
    'Bir gün açıkken “Planlandı” yalnızca o günü listeler ve bunu belirtir: “Yalnızca açık gün gösteriliyor”, yanında da “Tüm yolculuğu göster”.',
  'help.guide.filter-places.tip.2':
    'Harita da “Göster”i, kategorileri ve puanı uygular; bir gün açıkken haritadaki “Planlandı” yalnızca o günü gösterir. Arama ve küre simgesi yalnızca listeyi filtreler.',
  // edit-place
  'help.guide.edit-place.title': 'Bir yeri değiştirin',
  'help.guide.edit-place.goal': 'Bir adı düzeltin, iğneyi taşıyın, web sitesi ekleyin ya da kategoriyi değiştirin.',
  'help.guide.edit-place.step.1':
    'Satıra sağ tıkla ve “Düzenle”yi seç ya da satırın sonundaki “Diğer seçenekler”e tıkla ya da yeri aç ve ayrıntılarında “Düzenle”ye tıkla.',
  'help.guide.edit-place.step.2':
    'Yeri Düzenle penceresinde gerekeni değiştirin: pencere başlığındaki ad ve Kategori etiketi, Adres, Enlem ve Boylam, Açıklama, Notlar, Web sitesi, Telefon, E-posta ve çalışma saatleri. Yer tam olarak bir günde yer alıyorsa ya da yeri bir günden açtıysanız formda ayrıca bu güne özel Başlangıç, Son ve Notlar alanları da olur.',
  'help.guide.edit-place.step.3': '“Güncelle”ye tıklayın.',
  'help.guide.edit-place.result':
    'Değişiklik yerin göründüğü her yerde geçerli olur: listede, haritada ve eklendiği her günde.',
  'help.guide.edit-place.tip.1':
    '“Bu gün için notlar” yere yalnızca o günde bağlıdır; “Notlar” yerin kendisine aittir.',
  'help.guide.edit-place.tip.2':
    '“Son” saati “Başlangıç”tan önceyse “Güncelle” engellenir. “Zaman şununla çakışıyor:” ise yalnızca günün başka bir durağının aynı saate sahip olduğunu uyarır.',
  // delete-place
  'help.guide.delete-place.title': 'Bir yeri silin',
  'help.guide.delete-place.goal': 'Bir yeri seyahatten kalıcı olarak kaldırın.',
  'help.guide.delete-place.step.1':
    "Satıra sağ tıklayıp Sil'i seçin (satırın sonundaki Diğer seçenekler de Sil'i içerir) ya da yerin ayrıntılarında Sil'e tıklayın.",
  'help.guide.delete-place.step.2':
    'Onay sorusunda “Sil”e tıklayın. Yerde bir gece ayrılmışsa ya da yere bağlı bir rezervasyon varsa soru, yerle birlikte nelerin silineceğini belirtir.',
  'help.guide.delete-place.result':
    'Yer listeden, haritadan ve tüm günlerden kaldırılır. Günlerin üstündeki araç çubuğundaki “Geri al” onu geri getirir.',
  'help.guide.delete-place.tip.1':
    'Bir yeri yalnızca tek bir günden çıkarmak için bunun yerine o durakta “Günden Kaldır”ı kullanın.',
  'help.guide.delete-place.tip.2':
    'Birkaç yeri aynı anda silmek için aramanın yanındaki onay işaretine tıklayıp seçim başlatın.',
  // select-places
  'help.guide.select-places.title': 'Birkaç yeri aynı anda değiştirin ya da silin',
  'help.guide.select-places.goal': 'Birçok yeri tek tek değil, aynı anda değiştirin.',
  'help.guide.select-places.step.1':
    'Arama alanının yanındaki onay işaretine tıklayın. Satırlarda yuvarlak onay kutuları belirir ve sütunun altında eylem çubuğu açılır.',
  'help.guide.select-places.step.2':
    'İşaretlemek için satırlara tıklayın. Çubuktaki çift onay işareti olan “Tümünü seç”, filtrelerin gösterdiği tüm satırları seçer.',
  'help.guide.select-places.step.3':
    'Çubuk, işaretlenen yerlerin sayısını gösterir. Kategoriyi değiştir hepsine tek bir kategori verir. Koleksiyona kaydet (Koleksiyonlar açıkken) yerleri koleksiyonlarınızdan birine kopyalar. Seçileni sil, onaydan sonra yerleri siler.',
  'help.guide.select-places.step.4': 'Seçimi bitirmek için çubuğun sonundaki “Bitti” (X) düğmesine tıklayın.',
  'help.guide.select-places.result':
    'Değişiklik seçili her yere uygulanır; silme işlemi günlerin üstündeki araç çubuğundan geri alınabilir.',
  'help.guide.select-places.tip.1':
    'Seçim yaparken filtreler çalışmaya devam eder: önce “Planlanmamış”a göre filtreleyin, sonra “Tümünü seç” yalnızca o yerleri seçer.',
  'help.guide.select-places.tip.2':
    '“Listelerinde ziyaret edildi olarak işaretle”, “Koleksiyonlar” eklentisi açıkken çubukta görünür: yerleri kayıtlı oldukları koleksiyonlarda ziyaret edildi olarak işaretler.',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX, KML ya da KMZ dosyasından yerleri içe aktarın',
  'help.guide.import-places-file.goal':
    '“Turlar” eklentisi kapalıysa Google My Maps, Google Earth veya bir GPS izleyicisinin dışa aktardığı iğneleri ve yolları yer olarak içe aktar.',
  'help.guide.import-places-file.step.1':
    'Ekle düğmesinin yanındaki simge düğmesi olan “Yerleri İçe Aktar”a tıkla ve “Dosyayı içe aktar”ı seç ya da dosyayı yerler sütununun herhangi bir yerine bırak. İkisi de yalnızca yönetici “Turlar” eklentisini kapattıysa bulunur.',
  'help.guide.import-places-file.step.2':
    "Dosyayı seçin ya da kutuya sürükleyin. GPX için neyin içe aktarılacağını işaretleyin: Ara noktalar, Rotalar, İzler (yol geometrisi ile). KML ve KMZ için Noktalar (Yer İşaretleri) ve Yollar (LineString'ler) seçeneklerini işaretleyin.",
  'help.guide.import-places-file.step.3':
    "Kutu aynı anda birden fazla dosya alır, ama yalnızca .gpx, .kml ve .kmz kabul eder. Başka türden bir dosya ya da 10 MB'tan büyük bir dosya pencerede reddedilir ve içe aktarılmaz.",
  'help.guide.import-places-file.step.4':
    "İçe aktar'a tıklayın. Bir ileti kaç yerin içe aktarıldığını söyler. KML ya da KMZ dosyasında pencere, nelerin oluşturulduğunu ve nelerin atlandığını gösteren bir özetle açık kalır.",
  'help.guide.import-places-file.result':
    'Yerler listededir. İz olan bir satırda renkli çizgi görünür, iz haritada çizilir ve kendi İzler filtresi olur.',
  'help.guide.import-places-file.tip.1':
    'Çok büyük bir dosya reddedilir ve TREK boyut sınırını gösterir. Dosyayı fotoğraflar olmadan yeniden dışa aktarın ya da bölün.',
  'help.guide.import-places-file.tip.2':
    'İçe aktarmanın tamamını günlerin üstündeki araç çubuğundan geri alabilirsiniz.',
  // import-places-list
  'help.guide.import-places-list.title': 'Paylaşılan bir Google Maps veya Naver Maps listesini içe aktarın',
  'help.guide.import-places-list.goal': 'Paylaşılan bir liste bağlantısından yerleri içe aktarın.',
  'help.guide.import-places-list.step.1':
    'Ekle düğmesinin yanındaki simge düğmesi olan “Yerleri İçe Aktar”a tıkla ve “Liste İçe Aktarma”yı seç.',
  'help.guide.import-places-list.step.2':
    '“Sağlayıcı” altında “Google Listesi” veya “Naver Listesi”ni seç, sonra listenin paylaşılan bağlantısını “Bağla” alanına yapıştır. Google Haritalar yol tarifi bağlantısı da çalışır: duraklar sürüş sırasıyla yer olur.',
  'help.guide.import-places-list.step.3': '“İçe aktar”a tıklayın.',
  'help.guide.import-places-list.result':
    'Listedeki her yer, listedeki adıyla seyahate eklenir; seyahatte zaten olan yerler atlanır.',
  'help.guide.import-places-list.tip.1':
    'Liste herkese açık paylaşılmış olmalı; özel bir listenin bağlantısı hiçbir şey içe aktarmaz.',
  'help.guide.import-places-list.tip.2':
    'TREK’inizde bir Google anahtarı varsa iletişim kutusunda “Yerleri Google ile zenginleştir” görünür: içe aktarılan her yeri arar, fotoğrafları, adresi ve ayrıntıları doldurur.',
  'help.guide.sort-places.title': 'Yer listesini sıralayın',
  'help.guide.sort-places.goal': 'Listeyi ada, puana ya da en son eklenene veya değiştirilene göre sıralayın.',
  'help.guide.sort-places.step.1':
    'Filtre satırının sonundaki ok düğmesi olan “Sırala”ya tıkla. Geçerli sıralama onay işaretiyle belirtilir, düğmenin ipucu da sıralamanın adını gösterir.',
  'help.guide.sort-places.step.2':
    'Bir sıralama seç, örneğin “En yüksek puanlı”, ya da ada göre sırala. Liste hemen güncellenir.',
  'help.guide.sort-places.result': 'Liste, başka bir sıra seçene kadar yerleri seçtiğiniz sırayla gösterir.',
  'help.guide.sort-places.tip.1':
    '“Son eklenenler” dışındaki her sıralama düğmeyi vurgular; böylece listenin farklı sıralandığını hemen görürsünüz.',
  'help.guide.sort-places.tip.2':
    'Sıralama yalnızca listeyi değiştirir. Günler kendi sırasını korur ve tarayıcın seçtiğin sıralamayı hatırlar.',
  'help.guide.place-by-hand.title': 'Aramanın bilmediği bir yeri ekleyin',
  'help.guide.place-by-hand.goal':
    'Yer araması hiçbir şey bulamadığında bir yeri telefonu, e-postası ve çalışma saatleriyle kendiniz girin.',
  'help.guide.place-by-hand.step.1':
    "Yer penceresinde adı aramaya yazın ve Enter'a basın. Hiçbir şey bulunamazsa pencere bunu bildirir ve “Elle ekle” seçeneğini sunar.",
  'help.guide.place-by-hand.step.2':
    '“Elle ekle”ye tıklayın. Aradığınız metin ad olur ve pencere iletişim alanlarına kayar.',
  'help.guide.place-by-hand.step.3': 'Biliyorsanız “Telefon” ve “E-posta” alanlarını doldurun.',
  'help.guide.place-by-hand.step.4':
    '“Çalışma saatleri ekle”ye tıklayın ve yerin her gün ne zaman açılıp kapandığını ayarlayın. Kopyala düğmesi her güne ilk günün saatlerini verir; bir günün anahtarı ise o günü “Kapalı” olarak işaretler.',
  'help.guide.place-by-hand.step.5': '“Ekle”ye tıklayın.',
  'help.guide.place-by-hand.result':
    'Yer listeye eklenir. Ayrıntılarında, aramanın bulduğu bir yerde olduğu gibi, girdiğiniz telefon, e-posta ve çalışma saatleri görünür.',
  'help.guide.place-by-hand.tip.1':
    'Kendi saatleri olmayan bir yeri düzenlerken çalışma saatleri soldaki “Yer ayrıntıları” bölümünden otomatik kopyalanır. Yerin zaten saatleri varsa yanındaki bir düğme, aranarak bulunan saatleri kopyalar.',
  'help.guide.place-by-hand.tip.2':
    'Girdiğiniz saatler bulunan saatlerin yerine geçer, böylece mevsimlik saatleri olan bir kafe sizin bildiğiniz saatleri gösterir.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Günler',
  'help.ctx.trip-days.summary':
    'Planın sol sütunu: her gün için bir kart; kartta durakları sırasıyla, notları, o günün rezervasyonlarını ve ulaşımını, ayrıca duraklar arasındaki rotayı görürsünüz. Seyahat asıl burada planlanır.',
  'help.ctx.trip-days.bullet.1':
    'En üstteki başlık: solda Dışa aktar (PDF, takvim, GPX), sağda geri alma oku, Tüm günleri genişlet / Tüm günleri daralt, Günleri yeniden sırala ve bir rezervasyonun çizilecek rotası olduğunda Tüm rezervasyon rotalarını göster.',
  'help.ctx.trip-days.bullet.2':
    "Gün kartı: gün numarası ve hava tahminini gösteren bir kutucuk, başlık (siz ad verene kadar Gün 1) ve tarih; bunların altında gecelik konaklama (girişte yeşil, çıkışta kırmızı, onaylanana kadar kesikli çizgili; bileti rezervasyonu açar) ve kiralık araba için etiketler. Günü açmak için başlığa tıklayın, ok simgesi kartı daraltır, + (Güne ekle) ise bir menü açar: Bu güne yer ekle, Konaklama ekle, Ulaşım ekle, Toplu taşıma ve Not Ekle. Başlığa sağ tıklamak aynı menüyü ve ayrıca Günü temizle'yi sunar.",
  'help.ctx.trip-days.bullet.3':
    'Bir günün içinde sırayla duraklar yer alır. Her durakta resim, kategori simgesi, ad, saat ve açıklama, durağa bağlı rezervasyonlar ve kimlerin katıldığı görünür. Ardından notlar ve günün rezervasyonları ile ulaşımı gelir, türlerine göre renklendirilmiş olarak. Bir durağın üzerine gelince tutamağı, resmindeki kilidi, okları, Rezervasyon ekle ve üç noktayı (Diğer seçenekler) görürsünüz. Duraklara ve notlara sağ tıklayarak da menülerini açabilirsiniz.',
  'help.ctx.trip-days.bullet.4':
    "Açık günde iki durak olunca altlarında rota çubuğu belirir: “Rota” günü haritada gösterir ve duraklar arasındaki her bölümün yolculuk süresini verir; üç simge gün için “Araba”, “Yürüyüş” veya “Bisiklet”i ayarlar; ardından “Optimize et”, “Google Haritalar'da aç” ve “CoMaps'te aç” gelir.",
  'help.ctx.trip-days.bullet.5':
    'Bir güne yer eklemenin birkaç yolu var: yerler sütunundan bir satırı sürükleyin, o satırdaki “+ Gün”ü kullanın, günün + menüsünden ya da boş bir günden “Bu güne yer ekle”yi kullanın veya yerin ayrıntılarından ekleyin.',
  'help.ctx.trip-days.bullet.6':
    'Altta “Toplam Maliyet”, “Maliyetler”deki harcamalardan günün duraklarına ve rezervasyonlarına ait olanları, her birini bir kez olmak üzere, görüntüleme para biriminle toplar.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Bir günü okuyun',
  'help.guide.read-day-plan.goal': 'Bir şeyi değiştirmeden önce gün kartının her bölümünün ne anlattığını öğrenin.',
  'help.guide.read-day-plan.step.1':
    'Başlık: gün numarası ve hava tahminini gösteren bir kutucuk, ardından “Gün 1” ya da verdiğin başlık ve tarih. Altlarında gecelik konaklama için etiketler (girişte yeşil, çıkışta kırmızı, onaylanmamışsa kesikli; üzerindeki bilet rezervasyonu açar) ve kiralık araba için etiket bulunur. Günü açmak için başlığa tıkla (ayrıntı paneli haritanın üzerinde açılır). Sağdaki + (“Güne ekle”) bir yer, konaklama, ulaşım, toplu taşıma bağlantısı veya not ekler; ok simgesi kartı daraltır.',
  'help.guide.read-day-plan.step.2':
    'Bir durakta önce resmi, kategori simgesi ve adı görünür; Başlangıç saati varsa saati, sonra da açıklaması gelir. Bu güne ait notlar (Bu gün için notlar) altında yer alır. Satırın üzerine gelince denetimleri belirir: soldaki tutamak sürüklemeye yarar, resim rota optimizasyonu için bir kilide dönüşür, sağ uçta ise oklar (Yukarı taşı, Aşağı taşı), Rezervasyon ekle ve üç nokta (Diğer seçenekler) bulunur.',
  'help.guide.read-day-plan.step.3':
    'Bir duraktaki rezervasyon, durağın üzerinde Rezervasyon rozeti olarak görünür; onaylandıysa yeşil, beklemedeyse amber renktedir ve saatiyle taşıyıcısını gösterir. Rezervasyonu açmak için rozete tıklayın, yanındaki rota düğmesi rotasını çizer. Ulaşım ise türüne göre renklendirilmiş, saati ve Kalkış ya da Varış bilgisiyle kendi satırında görünür. Ayrıntıları açmak için bir rezervasyona tıklayın, oradaki Düzenle rezervasyonu değiştirir.',
  'help.guide.read-day-plan.step.4':
    'Rota açıkken iki durak arasındaki bağlantı, bölümün günün ulaşım biçimiyle ne kadar sürdüğünü ve ne kadar uzun olduğunu gösterir. Yalnızca o bölümün ulaşım biçimini değiştirmek için ona tıklayın.',
  'help.guide.read-day-plan.step.5':
    "Açık günün duraklarının altındaki rota çubuğu: Rota günün yolunu haritada çizer, üç simge Araba, Yürüyüş ya da Bisiklet'i seçtirir, Optimize et durakları yeniden sıralar, Google Haritalar'da aç ve CoMaps'te aç ise günü o uygulamalarda açar.",
  'help.guide.read-day-plan.result':
    'Karttaki her simgenin bir anlamı vardır. Aşağıdaki kılavuzlar her birinin nasıl değiştirileceğini anlatır.',
  'help.guide.read-day-plan.tip.1':
    'Menüsü için bir durağa sağ tıkla ya da üç noktasına tıkla: “Düzenle”, “Günden kaldır”, “Rotanın dışında bırak”, “Web Sitesini Aç”, “Koleksiyona kaydet”, “Sil”. Navigasyon uygulamaları yerin ayrıntılarında, “Navigasyon” altında yer alır.',
  'help.guide.read-day-plan.tip.2':
    'Bir durağın üzerine gelin, satırın sonunda “Rezervasyon ekle” görünür. Orada oluşturduğunuz rezervasyon bu günkü bu durağa bağlanır.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Bir yeri bir güne ekleyin',
  'help.guide.place-onto-day.goal': 'Listedeki bir yeri günün bir durağı yapın ve sıradaki doğru yere yerleştirin.',
  'help.guide.place-onto-day.step.1':
    'Yerler sütunundan bir satırı gün kartının üzerine sürükle. Tam olarak orada olmasını istiyorsan iki durağın arasına, sona eklemek için günün başlığına bırak.',
  'help.guide.place-onto-day.step.2':
    'Sürüklemeden eklemek için: önce başlığına tıklayarak günü aç, sonra yerin satırının sonundaki yuvarlak + işaretine (+ Gün) tıkla ya da satıra sağ tıklayıp “+ Gün”ü seç.',
  'help.guide.place-onto-day.step.3':
    'Günün + menüsündeki ya da boş bir gündeki “Bu güne yer ekle” yer formunu açar; yeni yer hemen o güne eklenir.',
  'help.guide.place-onto-day.step.4':
    'Bir gün açıkken bir yerin ayrıntılarındaki “Güne Ekle” yeri o güne ekler; yerler sütununun başlığındaki “Güne” ise açık günde doğrudan yeni bir yer oluşturur.',
  'help.guide.place-onto-day.result':
    'Yer artık günün bir durağıdır. Haritada günün numarasıyla görünür ve yerler sütunu onu “Planlandı” altında sayar.',
  'help.guide.place-onto-day.tip.1':
    'Bir yer birkaç günde olabilir: ikinci güne de yerler sütunundan ekleyin. Bir durağı bir gün kartından başkasına sürüklemek ise onu taşır.',
  'help.guide.place-onto-day.tip.2': 'Üst bantta yer alan geri alma oku atamayı geri alır.',
  'help.guide.place-onto-day.tip.3':
    'Bir durağı, saati sabit iki kaydın arasına ya da saati belli bir rezervasyonun önüne bırakamazsınız. Plan zaman sırasını korur.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Bir günün sırasını değiştirin',
  'help.guide.reorder-stops.goal': 'Bir durağı yukarı ya da aşağı taşıyın veya başka bir güne aktarın.',
  'help.guide.reorder-stops.step.1': 'Durağın üzerine gelin ve tutamağından tutup karttaki yeni konumuna sürükleyin.',
  'help.guide.reorder-stops.step.2':
    'Ya da üzerine geldiğiniz durağın sağ ucundaki okları kullanın (Yukarı taşı, Aşağı taşı): her tıklama bir adım taşır.',
  'help.guide.reorder-stops.step.3':
    'Bir durağı başka bir gün kartına sürükleyerek oraya taşıyın; eski günden kaldırılır.',
  'help.guide.reorder-stops.step.4':
    'Sabit saatli bir durağı taşımak günün sırasını bozacaksa TREK Saat kaldırılsın mı? diye sorar, çünkü saat durağın yerini belirler. Onayla saati kaldırır ve durak istediği yere gidebilir. İptal günü olduğu gibi bırakır.',
  'help.guide.reorder-stops.result': 'Rota ve yolculuk süreleri yeni sıraya göre hemen güncellenir.',
  'help.guide.reorder-stops.tip.1':
    'Saati sabit bir rezervasyon, saatinin olduğu konumda kalır. Gününde başka bir yere bırakırsan geri döner. Başka bir gün kartına sürüklersen o güne taşınır.',
  'help.guide.reorder-stops.tip.2':
    'Rota çubuğundaki “Optimize et”, günde üç veya daha fazla durak varsa tüm günü en kısa yola göre sıralar. Bir durağı bulunduğu yerde tutmak için önce onu kilitle.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Bir durağa saat verin',
  'help.guide.set-stop-times.goal':
    'Bir durağın ne zaman başlayıp bittiğini belirleyin; böylece gün bir program gibi işler.',
  'help.guide.set-stop-times.step.1':
    'Durağa sağ tıklayın ya da üç noktasına tıklayıp “Düzenle” seçeneğini seçin. Formu günden açarsanız konumun hemen altında o gün için “Başlangıç” ve “Son” alanları bulunur.',
  'help.guide.set-stop-times.step.2':
    '“Başlangıç” saatini, isterseniz “Son” saatini de girin. “Zaman şununla çakışıyor:” uyarısı, günün saatli başka bir durağının çakıştığını bildirir. Başlangıçtan önce bir “Son” saati “Güncelle” düğmesini engeller.',
  'help.guide.set-stop-times.step.3':
    '“Güncelle”ye tıklayın. Durak bir saat rozeti alır ve günde saatine uygun yere taşınır.',
  'help.guide.set-stop-times.result':
    'Saatli duraklar sıradaki yerlerini korur; saatsiz duraklar onların çevresine dizilir.',
  'help.guide.set-stop-times.tip.1': 'Saat o günkü durağa aittir; aynı yerin başka bir günde başka bir saati olabilir.',
  'help.guide.set-stop-times.tip.2':
    'Saatli bir durağı elle taşımak için sürükleyin. TREK “Saat kaldırılsın mı?” diye sorar; “Onayla”ya tıkladığınızda saat kaldırılır.',
  'help.guide.set-stop-times.tip.3':
    'Aynı formdaki “Bu gün için notlar”, yalnızca bu güne ait bilgiler içindir; örneğin bir masa rezervasyonu ya da bilet numarası.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Bir durağı günden çıkarın',
  'help.guide.remove-from-day.goal': 'Bir yeri seyahatten silmeden günden çıkarın.',
  'help.guide.remove-from-day.step.1': 'Durağa sağ tıkla ya da üç noktasına tıkla ve “Günden kaldır”ı seç.',
  'help.guide.remove-from-day.step.2':
    'Durak günden çıkarılır. Yer, başka bir günde yer almıyorsa “Planlanmamış” altında olmak üzere yerler sütununda kalır.',
  'help.guide.remove-from-day.result': 'Gün, rotası ve maliyeti güncellenir. Geri alma oku durağı geri getirir.',
  'help.guide.remove-from-day.tip.1': 'Aynı menüdeki “Sil”, yeri tüm seyahatten, yani her günden kaldırır.',
  'help.guide.remove-from-day.tip.2': '“Günden Kaldır” yerin ayrıntı panelinde de, “Güne Ekle”nin yanındadır.',
  // lock-stop
  'help.guide.lock-stop.title': 'Bir durağı yerine kilitleyin',
  'help.guide.lock-stop.goal': 'Rota optimize edilirken bir durağı yerinde tutun.',
  'help.guide.lock-stop.step.1':
    'Durağın resminin üzerine gelin ve kilide tıklayın: “Rota optimizasyonunda konumu koru”.',
  'help.guide.lock-stop.step.2':
    '“Optimize et” artık diğer durakları bunun çevresinde sıralar. Kilidi açmak için kilide yeniden tıklayın (“Kilidi açmak için tıklayın”).',
  'help.guide.lock-stop.result': 'Kilit resmin üzerinde görünür; kilidi açana kadar durak konumunu korur.',
  'help.guide.lock-stop.tip.1':
    'Saati sabit bir durak zaten saatiyle kilitlidir; optimizasyon sırasında yerinden oynamaz.',
  'help.guide.lock-stop.tip.2':
    'Kilit yalnızca sayfayı yeniden yükleyene kadar geçerlidir. Yeniden yüklemeden sonra her durağın kilidi yeniden açılır; yalnızca saatli duraklar sabit kalır.',
  // day-note
  'help.guide.day-note.title': 'Güne not ekleyin',
  'help.guide.day-note.goal': 'Bir hatırlatmayı, bilet numarasını ya da yedek planı güne kaydedin.',
  'help.guide.day-note.step.1': 'Günün başlığındaki + simgesine (“Güne ekle”) tıkla ve “Not Ekle”yi seç.',
  'help.guide.day-note.step.2':
    'Notun adını pencerenin üstünde “Not” yazan alana yazın. Gün kartında bu ad görünür. Gerisini “Günlük Not” alanına yazın: üstündeki araç çubuğu metni biçimlendirir (kalın, listeler, bağlantılar, alıntılar), soldaki “Önizleme” satırın nasıl görüneceğini gösterir.',
  'help.guide.day-note.step.3':
    'Not duraklardan kolayca ayırt edilsin diye bir “Simge” ve bir “Renk” seçin, sonra “Ekle”ye tıklayın.',
  'help.guide.day-note.step.4':
    'Not günde bir durak gibi görünür: sürükleyerek yerine koyun ya da oklarını kullanın. Düzenlemek için tıklayın. Sil, pencerede ve üç nokta ya da sağ tık menüsünde bulunur; önce Not silinsin mi? diye sorar.',
  'help.guide.day-note.result': "Not, sürüklediğiniz yerde günün ve PDF'in bir parçası olur.",
  'help.guide.day-note.tip.1': 'Nottaki bağlantılar yeni sekmede açılır ve tek bir satır sonu satır sonu olarak kalır.',
  'help.guide.day-note.tip.2': 'Notlar güne özeldir. Tüm seyahati ilgilendiren bir notu “İş birliği” bölümüne yazın.',
  // day-route
  'help.guide.day-route.title': 'Günün rotasını gösterin ve optimize edin',
  'help.guide.day-route.goal': 'Duraklar arasındaki rotayı görün, nasıl ulaşacağınızı seçin ve sırayı TREK düzenlesin.',
  'help.guide.day-route.step.1':
    "Günü açın ve durakların altındaki rota çubuğunda Rota'ya tıklayın: duraklar arasındaki yol haritada çizilir, duraklar arasındaki bağlantılar da her bölümün süresini ve mesafesini gösterir.",
  'help.guide.day-route.step.2':
    'Yanındaki üç simge günün ulaşım şeklini ayarlar: “Araba”, “Yürüyüş” veya “Bisiklet”. Bölümler yeniden hesaplanır. Eklentiler kendi modlarını ekleyebilir.',
  'help.guide.day-route.step.3':
    'Yalnızca o bölümün modunu değiştirmek için bağlantı çizgisine tıkla: bir mod seç, sunulduğu yerlerde ona bağlantı aramak için “Toplu taşıma”yı seç ya da günün moduna dönmek için “Günün varsayılanını kullan”ı seç.',
  'help.guide.day-route.step.4':
    '“Optimize et” (dairesel ok) üç duraktan itibaren durakları en kısa yola göre yeniden sıralar. Kilitli veya sabit saatli duraklar yerinde kalır; günde bir konaklama varsa rota oradan başlar.',
  'help.guide.day-route.step.5':
    "“Google Haritalar'da aç” veya “CoMaps'te aç” tüm günü o uygulamada, yolda yol tarifi almak için bir rota olarak açar. CoMaps ayrıca günün ulaşım şeklini de kullanır.",
  'help.guide.day-route.result':
    'Gün, saatleri olan bir rotaya dönüşür. Sıra değiştikçe “Toplam Maliyet” ve etaplar güncellenir.',
  'help.guide.day-route.tip.1':
    "Rotalar varsayılan olarak OSRM'den gelir. Yönetici, Kullanıcı Varsayılanları altından TREK'in başka bir rota motoru kullanmasını ayarlayabilir.",
  'help.guide.day-route.tip.2':
    'Rotası hesaplanamayan bir etap süre göstermez. İki durağın da koordinatı olduğundan emin olun.',
  'help.guide.day-route.tip.3': 'Geri al oku, optimizasyonu geri alır.',
  // manage-days
  'help.guide.manage-days.title': 'Gün ekleyin, sıralayın ve yeniden adlandırın',
  'help.guide.manage-days.goal': 'Yalnızca günlerdeki yerleri değil, günlerin kendisini de değiştirin.',
  'help.guide.manage-days.step.1':
    "Günler seyahatin tarihlerinden gelir. Tarihleri Pano'daki seyahatin düzenleme formundan değiştirirseniz günler baştan ya da sondan eklenir veya kaldırılır. İçeriği olan bir gün kaldırılmadan önce, hangi günlerin kaldırılacağını ve üzerlerinde neler olduğunu gösteren bir liste açılır.",
  'help.guide.manage-days.step.2':
    "Başlıktaki Günleri yeniden sırala bir liste açar: bir günü tutamağından sürükleyin ya da Yukarı taşı ve Aşağı taşı'yı kullanın. Gün, yerleri, notları ve rezervasyonlarıyla birlikte taşınır. Listenin altında Sonraki tarihle ekle, tarihli son günden sonra bir gün ekler ve seyahati bir gün uzatır. Tarihsiz, tarihi olmayan bir gün ekler. Tarihsiz bir seyahatte yalnızca Gün ekle vardır.",
  'help.guide.manage-days.step.3':
    'Satırın sonundaki çöp kutusu olan Günü sil önce sorar. Günle birlikte nelerin silineceğini listeler: günün yerleri, notları ve rezervasyonları, o gün giriş ya da çıkış yapan bir konaklama ve bir tarih öne kayan günler. Günü sil günü kaldırır, İptal günü korur. Son gün silinemez.',
  'help.guide.manage-days.step.4':
    'Bir günü yeniden adlandırmak için günü açın ve haritanın üzerindeki ayrıntı panelinde başlığının yanındaki kaleme tıklayın. Ad, kartta ve PDF’te “1. gün” yerine geçer.',
  'help.guide.manage-days.step.5':
    'Başlıktaki “Tüm günleri genişlet” ve “Tüm günleri daralt” tüm kartları tek seferde açar veya kapatır. Tek bir kartı daraltmak için okuna tıkla.',
  'help.guide.manage-days.result':
    'Tarihler konumla birlikte kalır: bir günü yukarı taşırsanız daha erken tarihi alır; durakları, notları ve rezervasyonları da onunla birlikte taşınır.',
  'help.guide.manage-days.tip.1':
    'Günleri taşıma işlemi geri alma okuyla geri alınabilir; bir günü silme işlemi geri alınamaz.',
  'help.guide.manage-days.tip.2':
    'Planın altındaki “Toplam Maliyet” tüm seyahati toplar; ayrıntısını “Maliyetler” sekmesinde görürsün.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Plandaki rezervasyonları ve ulaşımı okuyun',
  'help.guide.bookings-in-plan.goal':
    'Bir rezervasyon oluşturulduktan sonra nerede göründüğünü ve hangi ekranın onu oluşturduğunu görün.',
  'help.guide.bookings-in-plan.step.1':
    'Bir ulaşım (uçuş, tren, feribot, otobüs, araba) türüne göre renklendirilmiş bir satırdır; saati ile kalkış gününde “Kalkış”, varış gününde “Varış” yazar. Yanındaki küre simgesi saat dilimini gösterir ve aktarmalı uçuşta her bölüm için ayrı bir satır olur. Toplu taşıma bağlantısında hatları görmek için oka tıkla. Bir satıra tıklarsan rezervasyon açılır; oradaki “Düzenle” onu değiştirir.',
  'help.guide.bookings-in-plan.step.2':
    'Bir durağa bağlı rezervasyon (restoran, tur gibi) o durakta saatiyle birlikte “Rezervasyon” rozeti olarak görünür. Rozet onaylandığında yeşil, beklemedeyken kehribar renklidir. Günü olan ama durağı olmayan rezervasyon, günde kendi satırında görünür.',
  'help.guide.bookings-in-plan.step.3':
    "Bir otel gecesi Konaklama'dır. Gün başlığındaki etiketi girişte yeşil, çıkışta kırmızıdır ve bilet simgesi rezervasyonu açar. Günün ayrıntı paneli konaklamayı Konaklama altında listeler ve bu günlerin her birinin rotası oradan başlar.",
  'help.guide.bookings-in-plan.step.4':
    'Haritada, rezervasyon satırındaki rota düğmesi o rezervasyonun rotasını çizer. Başlıktaki Tüm rezervasyon rotalarını göster hepsini çizer.',
  'help.guide.bookings-in-plan.step.5':
    'Rezervasyon oluşturma yolları: üzerine geldiğiniz durakta Rezervasyon ekle, günün + menüsünde Ulaşım ekle ve Toplu taşıma. İçe aktarma ve dosyalarla birlikte tam liste için Rezervasyonlar ve Ulaşım sekmeleri.',
  'help.guide.bookings-in-plan.result':
    'Her rezervasyon planda bir kez görünür. Sekmeler aynı rezervasyonları liste olarak gösterir.',
  'help.guide.bookings-in-plan.tip.1':
    'Onaylandı ve beklemede, rezervasyonda kendinizin belirlediği bir durumdur. Plan bunu durakta gösterir, Rezervasyonlar sekmesi ise ikisini de sayar.',
  'help.guide.bookings-in-plan.tip.2':
    'Saati olan bir rezervasyonu gününde başka bir yere bırakırsan saatinin olduğu konuma geri döner. Başka bir gün kartına sürüklersen o güne taşınır. Saatini değiştirmek için rezervasyonu düzenle.',
  // export-plan
  'help.guide.export-plan.title': 'Planı dışa aktarın',
  'help.guide.export-plan.goal': 'Planı belge olarak, takviminize ya da bir GPS cihazına aktarın.',
  'help.guide.export-plan.step.1': 'Günlerin üstündeki başlık çubuğunun solundaki “Dışa aktar”a tıkla.',
  'help.guide.export-plan.step.2':
    '“Belge: PDF”, her günün duraklarını, notlarını ve rezervasyonlarını içeren yazdırma görünümünü açar; en başta rotaya genel bakış haritası bulunur. “Planım PDF olarak” yalnızca katıldıklarını içerir. Görünümde “Her gün için sayfa sonu” her günü yeni bir sayfada başlatır, “Ulaşım notları” ulaşımlarının notlarını ekler, “PDF olarak Kaydet” ise dosyayı indirir.',
  'help.guide.export-plan.step.3':
    '“Takvim”: “.ics indir” rezervasyonları takvim dosyası olarak kaydeder; “Takvime abone ol” takvim uygulamanızın otomatik yenilediği bir bağlantı verir.',
  'help.guide.export-plan.step.4':
    '“Haritalar ve GPS (GPX)”: “Tüm gezi” yerleri, gün rotalarını ve izleri; “Yalnızca yerler” yalnızca iğneleri; “Günler rota olarak” ise her gün için bir rotayı dışa aktarır. Çevrimdışı haritalar ve GPS cihazları için kullanılır.',
  'help.guide.export-plan.result': 'Dosya iner, seyahatte hiçbir şey değişmez.',
  'help.guide.export-plan.tip.1':
    "Tek bir günü harita uygulamasında açmak için günün rota çubuğunu kullanın: “Google Haritalar'da aç” ya da “CoMaps'te aç”.",
  'help.guide.export-plan.tip.2':
    "Takvime abone ol için ayarlarınızda takvim akışlarının açık olması ve seyahati paylaşma yetkinizin bulunması gerekir. Bunun için Pano'da bir rehber var.",
  'help.guide.export-plan.tip.3':
    "Dışa aktarmak için yalnızca okuma yetkisi yeterlidir: seyahatin her üyesi PDF'i, .ics dosyasını ve GPX'i dışa aktarabilir.",

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Yer ayrıntıları',
  'help.ctx.trip-place.summary':
    'Bir yer seçtiğinizde haritanın üzerinde açılan kart: seyahatin o yer hakkında bildiği her şey, herkesin verdiği yıldızlar, yerin resmi ve dosyaları; ayrıca yeri açık güne ekleyen, bir harita uygulamasında açan ya da bir listeye kaydeden düğmeler.',
  'help.ctx.trip-place.bullet.1':
    'Yerler sütunundaki bir satıra, bir gündeki bir durağa ya da haritadaki bir işaretçiye tıkla; kart haritanın üzerinde açılır. Kartı bir günden açarsan kart hangi durağı kastettiğini bilir ve durağın katılımcılarını ile rezervasyonunu da gösterir. Bir tur (“Turlar” sekmesinden bir doğa yürüyüşü, bir bisiklet sürüşü veya bir gezinti) ise bu kartın yerine kendi tur kartını açar.',
  'help.ctx.trip-place.bullet.2':
    'Başlıkta yuvarlak resim, ad, tek satırlık adres ve bilinen bilgiler için etiketler yer alır: açık veya kapalı, kategori, saat, fiyat, telefon numarası, e-posta ve koordinatlar. Kendi resmini ya da yerin dosyalarındaki bir fotoğrafı kullanmak için resme tıkla. Yeri yeniden adlandırmak için ada çift tıkla. Sağdaki X kartı kapatır. Resim, yeniden adlandırma, “Düzenle” ve “Sil” yalnızca yerleri değiştirebilen gezginler için kullanılabilir.',
  'help.ctx.trip-place.bullet.3':
    'Altında: her yolcunun yere verdiği yıldızlar, açıklama ve notlar, ayrıca durakta varsa “Bu gün için notlar”.',
  'help.ctx.trip-place.bullet.4':
    'Ardından geçerli oldukları ölçüde “Açılış Saatleri”, “İz rengi”, “İstatistikleri Takip Et” ve “Dosya” gelir. “Dosya” başlığındaki “Yükle” bilgisayarından dosya ekler; liste ayrıca bu durağa sabitlenmiş dosyaları ve rezervasyonunun dosyalarını, otelin onay belgesi dahil, gösterir. Eklentiler altına kendi satırlarını ekleyebilir.',
  'help.ctx.trip-place.bullet.5':
    "En alttaki satır: bir gün açıkken “Güne Ekle” veya “Günden Kaldır”, sonra “Navigasyon” (Ayarlar'da bir harita uygulaması seçtiysen onun adı), “Web Sitesini Aç” ve “Koleksiyona kaydet”. Sağda kırmızı çöp kutusu yeri siler, “Düzenle” formunu açar.",
  'help.ctx.trip-place.bullet.6':
    "Aramadan seçtiğiniz bir yerde, TREK dizininin ya da OpenStreetMap'in o yer hakkında bildikleri görünür. Üstteki etiketlerin arasında Açık ya da Kapalı yer alır; resmin çevresindeki yeşil ya da kırmızı halka da yerin kendi yerel saatine göre belirlenir. Telefon numarası da bir etiket olarak gösterilir. Aşağıda Açılış Saatleri bulunur: satırda bugünün saatleri görünür, tıklayınca tüm hafta açılır. Web sitesi ise Web Sitesini Aç altındadır. Google puanı yalnızca Google anahtarı olan bir TREK'te ve Google ile bulunmuş bir yerde görünür. Yerin formuna kendiniz yazdığınız çalışma saatleri, telefon numarası ve e-posta, aranarak bulunanların yerine geçer ve halkanın rengini de belirler.",
  // read-place
  'help.guide.read-place.title': 'Kart bir yer hakkında neler söylüyor',
  'help.guide.read-place.goal': 'Seyahatin bir yer hakkında bildiği her şeyi tek bir kartta okuyun.',
  'help.guide.read-place.step.1':
    'Günler sütununda okumak istediğiniz durağa tıklayın. Kart haritanın üzerinde açılır ve durak kendi gününde işaretli kalır.',
  'help.guide.read-place.step.2':
    'En üstte: yuvarlak resim, ad ve adres tek satırda; ipucunda adresin tamamı görünür. Altındaki etiketler yerin yerel saatine göre şu anda Açık mı Kapalı mı olduğunu söyler, resmin çevresindeki yeşil ya da kırmızı halka da buna uyar. Etiketler ayrıca kategoriyi, saati, telefon numarasını ve e-postayı gösterir (tıklarsanız telefon ya da e-posta uygulamanız açılır), geniş ekranda tam koordinatları da. Sağdaki X kartı kapatır.',
  'help.guide.read-place.step.3':
    'Başlığın altındaki ilk bölüm “Puan”dır: her gezginin yere verdiği yıldızlar, ortalama ve kaç kişinin oy verdiği. Kimse oy vermediği sürece “Henüz puanlanmadı” yazar.',
  'help.guide.read-place.step.4':
    'Sonra açıklama ve altında notlar gelir. İkisi de yer formundaki metindir ve biçimlendirme çalışır: listeler, bağlantılar ve kalın yazı görünür.',
  'help.guide.read-place.step.5':
    '“Katılımcılar”, bu durağa kimlerin gideceğini gösterir. Siz birini çıkarana kadar herkes dahildir.',
  'help.guide.read-place.step.6':
    'Daha aşağıda “Açılış Saatleri”: satır, baktığınız günün saatlerini gösterir. Tıklarsanız o gün kalın yazılmış olarak tüm hafta açılır. “Dosya” bölümü yanındadır.',
  'help.guide.read-place.result':
    'Kart, X ile kapatana ya da başka bir yer seçene kadar açık kalır. Haftalık çalışma saatleri açık kalır ve yerin ait olduğu durak günler sütununda işaretli kalır.',
  'help.guide.read-place.tip.1':
    'Yeri yer sütunundan seçtiğinizde kart yeri gösterir ama bir durağı göstermez. Bu yüzden katılımcıları göstermez, rezervasyonlardan da yalnızca yerin kendisine ait olanları, örneğin bir otelin konaklamasını gösterir. Her şeyi görmek için günün içindeki durağı seçin.',
  'help.guide.read-place.tip.2':
    'Yerleri değiştirme iznin varsa formu açmadan yeniden adlandırmak için ada çift tıkla. Enter kaydeder, Escape değişikliği iptal eder.',
  'help.guide.read-place.tip.3':
    'Elle yazılan bir yerde yalnızca formuna girilen bilgiler bulunur. “Düzenle”ye tıklayıp “Telefon”, “E-posta” ve çalışma saatlerini kendin doldur ya da yeri “Yer ara…” altındaki önerilerden seç ve bilgilerin otomatik bulunması için “Güncelle”ye tıkla. Google puanı için Google anahtarı gerekir.',
  // rate-place
  'help.guide.rate-place.title': 'Bir yeri puanlayın',
  'help.guide.rate-place.goal': 'Bir yere kendi yıldızlarınızı verin ve diğer herkesin verdiği puanları görün.',
  'help.guide.rate-place.step.1':
    'Yeri açın. Yıldız satırı başlığın hemen altındadır ve şimdiye kadarki oyların ortalamasını, parantez içinde oy sayısıyla birlikte gösterir.',
  'help.guide.rate-place.step.2':
    'İstediğiniz yıldıza tıklayın. İmleci yıldızların üzerinde gezdirdikçe yıldızlar dolar, böylece vereceğiniz puanı görürsünüz.',
  'help.guide.rate-place.step.3':
    'Oyunuz hemen ortalamaya eklenir ve yanındaki yüzler oy verenleri gösterir. Herkesin yıldızlarını görmek için imleci satırın üzerinde tutun.',
  'help.guide.rate-place.step.4':
    'Aynı ortalama, yerler sütunundaki yer satırında da görünür, böylece listedeki en iyi yerleri kolayca bulursunuz.',
  'help.guide.rate-place.result':
    'Seyahatteki herkes yıldızlarınızı yerin üzerinde görür. Listenin üstündeki filtre satırındaki yıldız artık yalnızca en az belirli bir puana sahip yerleri gösterebilir.',
  'help.guide.rate-place.tip.1':
    'Yer ekleme, düzenleme ve silme hakkı yalnızca bazılarınızda olan bir seyahatte bile her gezgin puan verebilir.',
  'help.guide.rate-place.tip.2':
    'Puanınızı kaldırmak için zaten verdiğiniz yıldıza tıklayın. Kimse puanlamadıysa yer yeniden “Henüz puanlanmadı” gösterir.',
  'help.guide.rate-place.tip.3':
    'Yıldızların yanında en fazla altı oy veren kişi yüz simgesiyle gösterilir. İpucu balonu hepsini listeler ve sizi işaretler.',
  // place-image
  'help.guide.place-image.title': 'Bir yere kendi görselinizi koyun',
  'help.guide.place-image.goal': 'Otomatik küçük resmi kendi fotoğrafınızla değiştirin.',
  'help.guide.place-image.step.1': 'Yeri yerler sütunundan açın.',
  'help.guide.place-image.step.2':
    'İşaretçiyi başlıktaki yuvarlak resmin üzerine getir: bir kamera belirir ve ipucunda “Görsel yükle” yazar. Ona tıkla ve dosyanı seç. Yerin dosyaları arasında zaten fotoğraf varsa TREK önce seçim yapmanı ister: “Cihazdan yükle” ya da “Ekli dosyalardan” altındaki resimlerden biri.',
  'help.guide.place-image.step.3': 'Kartın üstünde artık sizin resminiz görünür; köşesinde küçük kırmızı bir X vardır.',
  'help.guide.place-image.step.4':
    'Aynı resim yerler sütunundaki yer satırında ve haritadaki işaretçisinde de görünür.',
  'help.guide.place-image.result':
    'Resminiz yer için her yerde kullanılır: kartta, yerler sütununda, gündeki durakta, haritadaki işaretçide ve paylaşılan bir seyahatte.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF ve WebP kabul edilir; iPhone’dan gelen HEIC dosyası yüklerken dönüştürülür.',
  'help.guide.place-image.tip.2':
    'Köşedeki X görselinizi kaldırır ve otomatik görsel yeniden gösterilir. Yerin kendisi değişmez.',
  'help.guide.place-image.tip.3':
    'Kendi resmini eklemediysen TREK yerin koordinatlarına göre bir resim arar. Bulamazsa kategorinin simgesini gösterir. Resmi yalnızca yerleri değiştirebilen gezginler ayarlayabilir.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Yeri açık güne ekleyin ya da günden çıkarın',
  'help.guide.place-day-assign.goal': 'Satırı planlayıcıda sürüklemek yerine kartın üzerindeki düğmeyi kullanın.',
  'help.guide.place-day-assign.step.1':
    'Günler sütununda bir günün başlığına tıklayın. Artık o gün açık gündür ve kart o güne uygulanır.',
  'help.guide.place-day-assign.step.2':
    'Yerler sütununda o günde olmayan bir yere tıklayın. Kartı açılır ve alttaki satırda “Güne Ekle” çıkar.',
  'help.guide.place-day-assign.step.3':
    '“Güne Ekle”ye tıklayın. Durak günün sonuna eklenir ve düğme “Günden Kaldır” olur.',
  'help.guide.place-day-assign.step.4':
    'Durak artık günün içinde, listenin sonundadır. Doğru konuma yukarı sürükleyin.',
  'help.guide.place-day-assign.step.5':
    '“Günden Kaldır” durağı günden geri çıkarır ve kartta yeniden “Güne Ekle” görünür.',
  'help.guide.place-day-assign.result': 'Durak güne eklenir ya da günden çıkarılır. Yerin kendisi değişmez.',
  'help.guide.place-day-assign.tip.1':
    'Düğme yalnızca bir gün açıkken vardır. Açık gün yoksa yerin ekleneceği bir gün de yoktur.',
  'help.guide.place-day-assign.tip.2':
    'Bir durağı günden çıkarırsanız yer seyahatte ve yerler sütununda kalır. “Sil” ise yeri her yerden kaldırır.',
  'help.guide.place-day-assign.tip.3':
    'Bir konaklama rezervasyonunun güne eklediği durakta bu iki düğme de çıkmaz. O geceyi günün konaklama bölümünden eklersiniz ve kaldırırsınız.',
  // place-participants
  'help.guide.place-participants.title': 'Bu durağa kimlerin gideceğini belirtin',
  'help.guide.place-participants.goal': 'Seyahatteki kişileri değiştirmeden, tek bir durağa kimlerin gideceğini seçin.',
  'help.guide.place-participants.step.1':
    'Günün içindeki durağa tıklayın. Kart açılır ve “Katılımcılar” bölümünde seyahatteki herkes listelenir.',
  'help.guide.place-participants.step.2':
    'Bir yolcuyu bu duraktan çıkarmak için etiketine tıklayın. İmleci etiketin üzerine getirdiğinizde ad üstü çizili görünür.',
  'help.guide.place-participants.step.3':
    'Biri eksik olur olmaz kesik çizgili bir + belirir. Durakta kimlerin olmadığını görmek için ona tıklayın.',
  'help.guide.place-participants.step.4':
    'Bir kişiyi yeniden eklemek için adına tıklayın. Herkes yeniden eklendiğinde durak yine tüm gruba ait olur.',
  'help.guide.place-participants.result':
    'Durak yalnızca seçtiğiniz gezginleri içerir. Grubun geri kalanı o saatte serbesttir.',
  'help.guide.place-participants.tip.1':
    '“Katılımcılar” yalnızca bir durak seçiliyken görünür; bu yüzden yeri yerler sütununda değil, günün içinde seçin. Ayrıca yalnızca birden fazla gezgini olan seyahatlerde görünür.',
  'help.guide.place-participants.tip.2':
    'Kimse seçilmemişse herkes gidiyor demektir. Bu yüzden bir duraktan son gezgin çıkarılamaz.',
  'help.guide.place-participants.tip.3': 'Kendi hesabı olmayan bir misafir de diğerleri gibi katılımcı olabilir.',
  // place-booking
  'help.guide.place-booking.title': 'Bir duraktaki rezervasyon',
  'help.guide.place-booking.goal': 'Bir durağa ait rezervasyonu görün, açın ve ona yenisini bağlayın.',
  'help.guide.place-booking.step.1':
    'Rezervasyonun ait olduğu durağı açın. Kart, rezervasyonu “Rezervasyonlar” altında kendi küçük kartı olarak listeler; kartta rezervasyonun adı ve “Onaylandı” ya da “Beklemede” görünür.',
  'help.guide.place-booking.step.2':
    'Rezervasyon kartında “Tarih”, “Saat” ve “Rezervasyon Kodu” ile rezervasyonun diğer bilgileri için (uçuş numarası, peron, giriş gibi) etiketler ve varsa rezervasyonun notları yer alır.',
  'help.guide.place-booking.step.3': 'Rezervasyon kartına tıklayın. Rezervasyon haritanın üzerinde açılır.',
  'help.guide.place-booking.step.4':
    'Rezervasyonun altındaki “Düzenle” kendi formunu açar. Bu formda “Gün atamasına bağla” bir rezervasyonu bir durağa bağlar ve bu durağı zaten gösterir. Formu yeniden kapatın.',
  'help.guide.place-booking.step.5':
    'Bir durak için yeni rezervasyon günler sütununda başlar: durağın üzerine gelin ve sonundaki bilet simgesi olan “Rezervasyon ekle”ye tıklayın. Form “Yeni Rezervasyon” olarak ve zaten bu durağa bağlı biçimde açılır.',
  'help.guide.place-booking.result':
    'Rezervasyon durağa bağlanır: kartta ve günde görünür, dosyaları da buradaki “Dosya” bölümünde listelenir.',
  'help.guide.place-booking.tip.1':
    'Rezervasyon, sabitlendiği durakta görünür; otel rezervasyonu ayrıca oteli nerede açarsan aç otelde de görünür. Durağı olmayan bir rezervasyon “Rezervasyonlar” sekmesinde yer alır.',
  'help.guide.place-booking.tip.2':
    'Birkaç rezervasyon aynı durağı paylaşabilir, örneğin aynı yerden başlayan bir öğle yemeği ve bir tur.',
  'help.guide.place-booking.tip.3':
    'Tren, uçuş veya feribot için “Düzenle”, bunun yerine “Ulaşım” sekmesinin kullandığı ulaşım formunu açar.',
  // place-files
  'help.guide.place-files.title': 'Bir yerin biletlerini yerle birlikte tutun',
  'help.guide.place-files.goal': 'Bileti, kuponu ya da haritayı ait olduğu yere ekleyin.',
  'help.guide.place-files.step.1':
    'Yeri açın. Dosya bölümü ayrıntıların altındadır; yerin açılış saatleri varsa onların yanında yer alır. Yerde hiç dosya yokken de Dosya yazar.',
  'help.guide.place-files.step.2': "Dosya başlığının sağındaki Yükle'ye tıklayın ve dosyayı seçin.",
  'help.guide.place-files.step.3': 'Düğme yerin kaç dosyası olduğunu gösterir ve liste kendiliğinden açılır.',
  'help.guide.place-files.step.4': 'Her satırda dosyanın adı ve boyutu görünür. Dosyayı açmak için satıra tıklayın.',
  'help.guide.place-files.result': 'Dosya yere eklenir ve kartta sayılır. Seyahatin “Dosyalar” sekmesinde de görünür.',
  'help.guide.place-files.tip.1':
    'Dosya, bu durağa sabitlenenleri ve rezervasyonuna eklenenleri de listeler. Böylece bir otel onayı otelin altında görünür.',
  'help.guide.place-files.tip.2':
    'Yükle aynı anda birkaç dosya kabul eder ve aralarındaki bir fotoğraf yerin resmi olabilir.',
  'help.guide.place-files.tip.3':
    'Dosya yükleme yetkiniz yoksa “Yükle” düğmesi görünmez. Yerde zaten bulunan dosyalar yine gösterilir.',
  // place-navigation
  'help.guide.place-navigation.title': 'Bir yeri harita uygulamasında ya da web sitesinde açın',
  'help.guide.place-navigation.goal': 'Yeri, oraya gitmek için kullandığınız navigasyon uygulamasında açın.',
  'help.guide.place-navigation.step.1': 'Yeri açın ve alttaki satırda “Navigasyon”a tıklayın.',
  'help.guide.place-navigation.step.2':
    "Liste, bu yere uygun harita uygulamalarından oluşur: Google Haritalar, Waze, Apple Maps, OpenStreetMap ve CoMaps; Android'de ayrıca “Başka bir harita uygulaması”.",
  'help.guide.place-navigation.step.3':
    'Kullandığınıza tıklayın. TREK mümkün olduğunda uygulamaya yalnızca koordinatları değil yerin kendisini gönderir; böylece doğru girişe varırsınız.',
  'help.guide.place-navigation.step.4':
    'Yanındaki “Web Sitesini Aç”, yerin kendi web sitesini, çalışma saatleri ve biletleriyle birlikte, yeni sekmede açar.',
  'help.guide.place-navigation.result':
    'Harita uygulaması yerin üzerinde açılır, web sitesi yeni sekmede açılır ve seyahatte hiçbir şey değişmez. TREK uygulama olarak kuruluysa yeni sekme yerine harita uygulaması açılır.',
  'help.guide.place-navigation.tip.1':
    'Waze hemen yol tarifine başlar. Diğer uygulamalar yeri açar; yol tarifini başlatmak için bir kez daha dokunursunuz.',
  'help.guide.place-navigation.tip.2':
    "Hangi uygulamaların sunulduğu yere ve cihazına bağlıdır: Apple Maps Android'de sunulmaz, 高德地图 yalnızca Çin'deki yerler için sunulur; Waze, Apple Maps ve CoMaps için yerin koordinatları gerekir. “Başka bir harita uygulaması” yeri Android telefonundaki herhangi bir harita uygulamasında açar.",
  'help.guide.place-navigation.tip.3':
    'Harita uygulamanı “Ayarlar”da “Yerleri şurada aç” altında bir kez seç. Düğme bundan sonra uygulamanın adını taşır ve uygulamayı hemen açar. Bir yer için yalnızca tek uygulama uygunsa da aynısı olur.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Bir yeri listelerinizden birine kaydedin',
  'help.guide.place-to-collection.goal': 'Bu seyahatte bulduğunuz bir yeri bir sonraki seyahat için kaydedin.',
  'help.guide.place-to-collection.step.1': "Yeri açın ve kartın altındaki satırda Koleksiyona kaydet'e tıklayın.",
  'help.guide.place-to-collection.step.2':
    'Listeye kaydet, sahibi olduğunuz ya da paylaştığınız tüm listeleri gösterir. Sağdaki dolu yer imi, bu yeri zaten içeren listeleri işaretler.',
  'help.guide.place-to-collection.step.3': 'Listeye tıklayın. Yer hemen listeye eklenir.',
  'help.guide.place-to-collection.step.4': 'Pencereyi X ile kapatın, karttaki düğmede Kaydedildi yazar.',
  'help.guide.place-to-collection.result':
    'Yer; resmi, notları ve adresiyle listenizde, bir sonraki seyahate hazır bekler.',
  'help.guide.place-to-collection.tip.1':
    'Düğme yalnızca “Koleksiyonlar” eklentisi açıkken görünür; bunu yönetici “Eklentiler” altından açar.',
  'help.guide.place-to-collection.tip.2':
    'Bir yer aynı anda birkaç listede olabilir ve her birinde farklı bir durumda olabilir: birinde fikir, diğerinde ziyaret edildi.',
  'help.guide.place-to-collection.tip.3':
    "Seçicinin üstünde, yerin adının altındaki Ziyaret edildi işaretle yeri listede ziyaret edildi olarak işaretler. Yer birkaç listenizdeyse düğmede Her yerde ziyaret edildi yazar ve yeri hepsinde birden işaretler. Görünüm, listelerinizi Koleksiyonlar'da açar.",
  // place-track
  'help.guide.place-track.title': 'Bir izi okuyun ve ona kendi rengini verin',
  'help.guide.place-track.goal':
    'İçe aktarılmış bir yürüyüşün ne kadar sürdüğünü ve haritada hangi çizginin bu yürüyüş olduğunu görün.',
  'help.guide.place-track.step.1':
    'Yerler sütununda bir izin satırında, haritadaki izin renginde kısa bir çizgi görünür. Ona tıklayın.',
  'help.guide.place-track.step.2': '“İstatistikleri Takip Et”, yolun uzunluğunu ayarladığınız birimde gösterir.',
  'help.guide.place-track.step.3':
    'Üstündeki “İz rengi” kullanılan rengi gösterir. Renk örneklerini açmak için satıra tıklayın.',
  'help.guide.place-track.step.4': 'Bir renk seçin. Haritadaki çizgi ve satırdaki çizgi de onunla birlikte değişir.',
  'help.guide.place-track.step.5':
    'Soldaki kesik çizgili hücre, “Otomatik renk”, ize varsayılan rengini geri verir. Sağdaki damlalık, başka bir renk için sisteminizin renk seçicisini açar.',
  'help.guide.place-track.result': 'İz seçtiğiniz renkle çizilir: kartta, yerler sütunundaki satırında ve haritada.',
  'help.guide.place-track.tip.1':
    "Bu iki blok yalnızca yolu olan bir yerde bulunur: Turlar gelmeden önce GPX, KML veya KMZ dosyasından içe aktarılmış bir yer ya da Turlar'ın kapalı olduğu bir TREK'te. Turlar açıkken yeni bir GPX dosyası tur olur ve kendi tur kartını açar.",
  'help.guide.place-track.tip.2':
    'Yükseklik verisiyle kaydedilmiş bir iz ayrıca en yüksek ve en alçak noktayı, çıkılan ve inilen metreyi ve yürüyüşün profilini gösterir.',
  'help.guide.place-track.tip.3':
    'İçe aktarma, eklediği her ize kendi rengini verir, böylece iki yürüyüş hiçbir zaman aynı renkte olmaz.',
  // read-place
  'help.guide.read-place.step.7':
    'Alttaki satır buradan yapabilecekleriniz içindir: yeri açık güne koyun ya da günden çıkarın, bir harita uygulamasında ya da web sitesinde açın, bir listeye kaydedin; sağ tarafta da silin (kırmızı çöp kutusu) veya düzenleyin.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Dosya',
  'help.ctx.trip-files.summary':
    'Seyahatin tüm belgeleri tek listede: biletler, onay belgeleri, cüzdan kartları ve resimler. Her birinin bir notu, ait olduğu yere ya da rezervasyona bir bağlantısı ve geri yükleyebileceğiniz bir çöp kutusu vardır.',
  'help.ctx.trip-files.bullet.1':
    "“Dosyaları buraya bırakın”, çubuğun altındaki kesikli kutu, üzerine bıraktığın dosyaları kabul eder. Ona tıklamak dosya seçiciyi açar. Kutuda bu TREK'in kabul ettiği dosya türleri ve dosya başına sınır görünür (yönetici başka bir değer belirlemediyse Maks. 50 MB).",
  'help.ctx.trip-files.bullet.2':
    'Üstteki çubukta “Dosyalar” ve “Tümü”, “PDF’ler”, “Görseller” ve “Belgeler” filtre sekmeleri yer alır; her birinin yanında sayısı vardır. Bir dosya yıldızlanır yıldızlanmaz “Tümü”nün ardına bir yıldız sekmesi, bir notun eki olur olmaz da en sona “İşbirliği Notları” sekmesi eklenir.',
  'help.ctx.trip-files.bullet.3':
    'Bir satırda küçük önizleme ya da dosya türü, yükleyen kişi, ad, altındaki not, boyut ve tarih görünür. Her bağlantı için de bir rozet vardır: yer, rezervasyon ya da ulaşım adıyla gösterilir (üzerine gelince “Gün Planı”, “Rezervasyon” veya “Ulaşım” yazar); bir de “İşbirliği notlarından” rozeti var.',
  'help.ctx.trip-files.bullet.4':
    'Satırın sonunda en fazla beş simge bulunur; üzerine gelince her birinin adı görünür: “Yıldızla”, “Ata” (kalem), “Açık”, “İndir” ve “Sil”. “Sil” onay sormaz: dosya, geri yükleyebileceğin çöp kutusuna gider. Çevrimdışıyken not, bağlantı, yıldız ve çöp kutusu yine çalışır ve TREK yeniden çevrimiçi olunca gönderilir; yalnızca yükleme ve başka bir bağlantıyı kaldırma için bağlantı gerekir.',
  'help.ctx.trip-files.bullet.5':
    'Bir resim ya da video tam ekranda açılır; ok tuşlarıyla ve küçük resim şeridiyle gezilir. Diğer her belge, en üstte adı, altında “Yeni sekmede aç” ve “İndir” bulunan bir iletişim kutusunda açılır. Cüzdan kartı doğrudan indirilir.',
  'help.ctx.trip-files.bullet.6':
    'Çubuğun sağ ucundaki çöp kutusu simgesi (“Çöp kutusu”) listeyi silinen dosyalara çevirir. Orada her dosyayı geri yükleyebilir ya da kalıcı olarak silebilirsiniz; çubuktaki “Çöp kutusunu boşalt” hepsini siler. “Belge eşitleme”, seyahat bir belge deposuna bağlıysa ya da bir depo açılır açılmaz seyahatin sahibi veya yönetici için çöp kutusu simgesinin solunda yer alır.',
  // files-upload
  'help.guide.files-upload.title': 'Seyahate belge ekleyin',
  'help.guide.files-upload.goal':
    'İndirilenler klasörünüzden bir bileti, onayı ya da fotoğrafı seyahate yükleyin, seyahatteki herkes açabilsin.',
  'help.guide.files-upload.step.1':
    'Seyahati açın ve sekme çubuğunda “Dosya”ya tıklayın. Seyahatin belgeleri orada listelenir, üstlerinde de yükleme kutusu bulunur.',
  'help.guide.files-upload.step.2':
    "“Dosyaları buraya bırakın”a tıkla ve bir ya da birkaç dosya seç. Dosyalar sırayla yüklenir ve yükleme sürerken kutuda “Yükleniyor...” yazar. Kutunun içinde, “veya göz atmak için tıklayın” satırının altında bu TREK'in kabul ettiği dosya türleri ve bir dosya için izin verilen en büyük boyut görünür.",
  'help.guide.files-upload.step.3':
    'Son dosyanın yüklemesi bitince, o dosya için “Dosya Ata” otomatik olarak açılır (seyahatte yer veya rezervasyon varsa); iletişim kutusunun en üstünde dosyanın adı görünür. “Not” altındaki “Not ekleyin...” dosyaya bir not ekler, altındaki listeler de dosyayı bir yere ya da rezervasyona bağlar. Sağ üstteki × ile kapatın; kapatmakla hiçbir şey kaybolmaz.',
  'help.guide.files-upload.step.4':
    'Yeni dosyalar listenin en üstünde görünür; yalnızca yıldızlı dosyalar bunların üstündedir. Satırda dosyayı kimin yüklediği, adı, boyutu ve tarihi görünür. Resimler küçük önizleme alır, diğer dosyalar türünü gösterir.',
  'help.guide.files-upload.result': 'Belgeler seyahattedir ve seyahati görebilen herkes onları açıp indirebilir.',
  'help.guide.files-upload.tip.1':
    'Bir dosyayı masaüstünden doğrudan kutunun üzerine de sürükleyebilirsiniz. Dosya kutunun üzerindeyken kutu vurgulanır.',
  'help.guide.files-upload.tip.2':
    "Panodaki bir resmi listeye eklemek için Ctrl+V'ye basın, böylece bir rezervasyonun ekran görüntüsünü önce kaydetmeniz gerekmez.",
  'help.guide.files-upload.tip.3':
    'Yükleme için dosya yükleme yetkisi gerekir; yetkiniz yoksa kutu hiç görünmez. Listede olmayan bir tür, bir iletiyle reddedilir ve hiçbir şey yüklenmez. Sınırı aşan bir dosya (yönetici başka bir değer belirlemediyse 50 MB) hiçbir şey gönderilmeden reddedilir ve ileti sınırı belirtir. Yükleme ayrıca bağlantı gerektirir: çevrimdışıyken TREK bunu söyler ve hiçbir şey yüklemez.',
  // files-link
  'help.guide.files-link.title': 'Bir belgeyi bir yere ya da rezervasyona bağlayın',
  'help.guide.files-link.goal': 'Bileti yalnızca bu listeden değil, ait olduğu günden de kolayca bulun.',
  'help.guide.files-link.step.1':
    'Satırın sonundaki kaleme (“Ata”) tıklayın. “Dosya Ata” açılır; iletişim kutusunun en üstünde dosyanın adı görünür.',
  'help.guide.files-link.step.2':
    '“Not” altındaki “Not ekleyin...” tek satır kabul eder; bu satır listede dosya adının altında görünür. Enter’a bastığınızda ya da kutudan çıktığınızda kaydedilir.',
  'help.guide.files-link.step.3':
    'Solda “Yer” altında seyahatin yerleri, güne göre ve tarihiyle gruplanmış olarak görünür; hiçbir günde olmayan yerler için en sonda “Atanmamış” yer alır. İşaretlemek için birine tıklayın.',
  'help.guide.files-link.step.4':
    'Sağda “Rezervasyon” ve “Ulaşım” altında seyahatin rezervasyonları yer alır. Belgenin ait olduğu rezervasyona tıklayın; ona da onay işareti konur.',
  'help.guide.files-link.step.5':
    'Sağ üstteki × ile kapatın. Burada kaydet düğmesi yoktur: her tıklama anında kaydedildi.',
  'help.guide.files-link.result':
    'Satırda not ve her bağlantı için bir rozet görünür: biri yerin adıyla, biri uçuşun adıyla. Rozetin üzerine gelince “Gün Planı” ya da “Ulaşım” yazar. Belge hem yere hem uçuşa da eklenir.',
  'help.guide.files-link.tip.1':
    'Bir dosyanın aynı anda birden fazla bağlantısı olabilir, böylece aynı onay belgesi hem otelin rezervasyonuna hem otelin yerine bağlanabilir.',
  'help.guide.files-link.tip.2':
    'İşaretli bir girdiye yeniden tıklarsanız o bağlantı kaldırılır, dosyanın kendisi kalır. Çevrimdışıyken not ve yeni işaretler kaydedilir, TREK yeniden çevrimiçi olunca gönderilir. Yalnızca başka bir bağlantıyı kaldırmak için bağlantı gerekir.',
  'help.guide.files-link.tip.3':
    'Tersi de geçerlidir: bir yere ya da rezervasyona eklenmiş bir belge bu listede de yer alır ve satırında aynı rozet bulunur.',
  // files-star
  'help.guide.files-star.title': 'Önemli belgeleri üstte tutun',
  'help.guide.files-star.goal':
    'Gerçekten ihtiyaç duyacağınız birkaç belgeyi işaretleyin; uzun bir listede hızlıca bulun.',
  'help.guide.files-star.step.1':
    'Satırın sonundaki yıldıza (“Yıldızla”) tıklayın. Yıldız altın rengine döner, dosya adının önünde ikinci bir yıldız belirir ve düğmenin üzerine gelince artık “Yıldızı kaldır” yazar.',
  'help.guide.files-star.step.2':
    'Liste yeniden sıralanır: yıldızlı dosyalar diğer dosyaların üstünde yer alır, her grubun içinde en yeni olanlar başta.',
  'help.guide.files-star.step.3':
    'Çubuktaki filtre sekmelerinde, “Tümü”nün hemen ardına, yanında yıldızlı dosya sayısıyla bir yıldız eklenir. Yalnızca bu dosyaları görmek için ona tıklayın.',
  'help.guide.files-star.result':
    'Yıldızlı dosyalar listenin en üstünde gösterilir ve bir sekme yalnızca yıldızlı dosyaları gösterir.',
  'help.guide.files-star.tip.1':
    'Yıldız sekmesi yalnızca yıldızlı bir dosya varken bulunur. Son dosyanın yıldızını kaldırdığınızda sekme de kaybolur.',
  'help.guide.files-star.tip.2':
    'Yıldızlamak, “Ata” ile aynı hakkı gerektirir: “Dosya meta verisini düzenle”. Bu hakkı olmayan üye yıldızları görür ama “Yıldızla”ya tıklaması onun için hiçbir şey değiştirmez.',
  // files-filter
  'help.guide.files-filter.title': 'Listede bir belge bulun',
  'help.guide.files-filter.goal': 'Tüm belgeler arasından yalnızca aradığınız türü gösterin.',
  'help.guide.files-filter.step.1':
    "Filtre sekmeleri üstteki çubukta, “Dosya” yanındadır: “Tümü”, “PDF'ler”, “Görseller” ve “Belgeler”, her birinin yanında dosya sayısıyla.",
  'help.guide.files-filter.step.2': "“PDF'ler” sekmesine tıklayın: liste yalnızca PDF dosyalarını gösterir.",
  'help.guide.files-filter.step.3':
    'İki sekme daha yalnızca seyahatte eşleşen dosyalar varsa görünür. “İşbirliği Notları”na tıklayın: “İş birliği” sekmesindeki bir nota ek eklenir eklenmez görünür ve liste yalnızca bu dosyaları gösterir. Bir yıldız sekmesi de bir dosya yıldızlanır yıldızlanmaz aynı şekilde görünür.',
  'help.guide.files-filter.step.4': '“Tümü” listenin tamamını geri getirir.',
  'help.guide.files-filter.result':
    'Liste yalnızca seçili sekmenin dosyalarını gösterir; her sekmedeki sayı kaç dosya olduğunu söyler.',
  'help.guide.files-filter.tip.1':
    'Burada klasör yoktur ve dosyaları yeniden adlandıramazsınız. Belgeleri birbirinden ayırmak için “Dosya Ata” içindeki notu, yerlere ve rezervasyonlara olan bağlantıları ve yıldızı kullanın.',
  'help.guide.files-filter.tip.2':
    'Liste her zaman önce yıldızlı dosyalar, sonra en yeniler olacak şekilde sıralanır; bu yüzden bugün yüklenen bir belge geçen ayki belgenin üstünde görünür.',
  // files-preview
  'help.guide.files-preview.title': "Bir belgeyi TREK'ten çıkmadan okuyun",
  'help.guide.files-preview.goal': 'Bir bileti ya da resmi hemen görüntüleyin, gerektiğinde cihazınıza indirin.',
  'help.guide.files-preview.step.1':
    'Bir resmin adına ya da küçük resmine tıklayın. Resim tam ekran açılır; sol üstte dosyanın adı ve resimler arasındaki sırası görünür. Video da aynı şekilde açılır ve orada oynatılır.',
  'help.guide.files-preview.step.2':
    'Listenin o anda gösterdiği tüm resimler arasında gezinmek için yanlardaki yuvarlak okları, sol ve sağ ok tuşlarını ya da alttaki küçük resim şeridini kullanın.',
  'help.guide.files-preview.step.3':
    '“Yeni sekmede aç” ve “İndir”, sağ üstte × işaretinin yanındaki yuvarlak düğmelerdir. Resmi kapatmak için ×’e tıklayın, Escape’e basın ya da koyu arka plana tıklayın.',
  'help.guide.files-preview.step.4':
    'Resim olmayan bir belge bunun yerine bir iletişim kutusunda açılır: en üstte adı, altında hap biçimli düğmeler olarak “Yeni sekmede aç” ve “İndir”, PDF ise aşağıda sayfanın kendisi görünür. Sağ üstteki ×, Escape ya da iletişim kutusunun dışına tıklamak onu kapatır.',
  'help.guide.files-preview.step.5':
    'Satırın sonundaki ok (“İndir”) dosyayı önce açmadan doğrudan cihazınıza kaydeder.',
  'help.guide.files-preview.result':
    'Belge ekranda görünür; aynı iki düğme onu tarayıcı sekmesinde açar ya da diskinize kaydeder.',
  'help.guide.files-preview.tip.1': 'Dokunmatik ekranda oklara tıklamak yerine resimler arasında kaydırabilirsiniz.',
  'help.guide.files-preview.tip.2':
    'Cüzdan kartları hiçbir zaman önizlemede açılmaz. Hemen indirilir, böylece telefon kartı cüzdan uygulamasında açabilir.',
  'help.guide.files-preview.tip.3':
    '“Yeni sekmede aç” ve “İndir”, dosyayı oturumunuzla yükler, bu yüzden adres çubuğundan kopyalanan bir bağlantı başkaları için çalışmaz.',
  // files-trash
  'help.guide.files-trash.title': 'Bir belgeyi silin ve geri getirin',
  'help.guide.files-trash.goal': 'Seyahatin artık ihtiyaç duymadığı dosyaları silin; hâlâ gerekenleri geri getirin.',
  'help.guide.files-trash.step.1':
    'Satırın sonundaki çöp kutusuna (“Sil”) tıklayın. Dosya listeden hemen kaldırılır ve “Çöp kutusuna taşındı” mesajı görünür. Onay sorusu yoktur.',
  'help.guide.files-trash.step.2':
    'Çubuğun sağ ucundaki çöp kutusu simgesi (“Çöp kutusu”) listeyi silinen dosyalara çevirir. Çubuğun başlığında “Çöp kutusu” yazar; filtre sekmeleri ve yükleme kutusu gizlenir.',
  'help.guide.files-trash.step.3':
    'Çöp kutusundaki satır soluk görünür ve iki simgesi vardır: dosyayı geri getiren “Geri yükle” ve onaydan sonra kalıcı olarak silen “Sil”.',
  'help.guide.files-trash.step.4':
    '“Geri yükle” düğmesine tıklayın. “Dosya geri yüklendi” iletisi görünür ve dosya çöp kutusundan çıkar. Notu ve bağlantıları korunur.',
  'help.guide.files-trash.step.5':
    'Çubukta çöp kutusu simgesinin yanındaki “Çöp kutusunu boşalt”, çöp kutusunda kalan her şeyi kalıcı olarak siler. Tarayıcı bunu yapmadan önce bir kez onay ister. Çöp kutusu simgesi dosyalara geri döner.',
  'help.guide.files-trash.result': 'Dosya, listede eskiden durduğu yere geri döner.',
  'help.guide.files-trash.tip.1':
    "Bir satırdaki Sil önce sormaz. Çöp kutusu bu yüzden vardır: siz burada silmedikçe hiçbir şey TREK'ten kaldırılmaz. Bunların hepsi çevrimdışıyken de çalışır ve TREK yeniden çevrimiçi olunca gönderilir.",
  'help.guide.files-trash.tip.2':
    'Bir dosyayı silmek ve geri getirmek için dosya silme hakkı gerekir. Bu hakkı olmayan üye satırda “Sil” düğmesini de çöp kutusundaki düğmeleri de görmez.',
  'help.guide.files-trash.tip.3': 'Çöp kutusunda kalıcı olarak silinen bir dosya geri getirilemez.',
  // files-sync
  'help.guide.files-sync.title': 'Belgeleri belge deponuzla eşitleyin',
  'help.guide.files-sync.goal':
    'Seyahati kendi belge deponuza bağlayın: burada yüklenen dosyalar oraya kaydedilsin, orada kaydedilen dosyalar burada görünsün.',
  'help.guide.files-sync.step.1':
    'Çubuğun sağ ucunda, çöp kutusu simgesinin yanındaki “Belge eşitleme” düğmesine tıklayın. Pencere, başlığının altında seyahatin adıyla açılır. Solda, “Sağlayıcı bağla” altında, yöneticinin açtığı depolar listelenir; her birinin altında dosyaları nasıl sakladığını anlatan bir satır vardır: Paperless-ngx ve Papra etiketle, Nextcloud ve Synology Drive bir klasörde, OpenCloud bir alanda. Sağda “Henüz bir şey bağlanmadı” yazar.',
  'help.guide.files-sync.step.2':
    'Deponuza tıklayın, burada Nextcloud. Bağlantı için daha küçük bir pencere açılır. Pencerede deponun adı yer alır ve bu deponun gerektirdiği oturum açma bilgileri istenir.',
  'help.guide.files-sync.step.3':
    '“Adres” alanını ve deponun kendi oturum açma bilgilerini doldurun: Paperless-ngx için bir API belirteci; Papra için bir API anahtarı ve Kuruluş kimliği; Nextcloud için kullanıcı adı ve bir uygulama parolası; OpenCloud için kullanıcı adı ve bir uygulama belirteci; Synology Drive için kullanıcı adı, parola ve hesap istiyorsa bir iki adımlı doğrulama kodu. Depo sunuyorsa her zaman uygulama parolası ya da belirteci kullanın, hesap parolanızı asla. Nextcloud ve Synology Drive ayrıca isteğe bağlı bir “Temel klasör” alır; TREK seyahat klasörlerini orada arar, burada /Reisen. En alttaki “Kendinden imzalı sertifikayı kabul et” yalnızca kendi ağınızdaki, böyle bir sertifikası olan bir depo içindir.',
  'help.guide.files-sync.step.4':
    '“Bağlantıyı test et”e tıklayın. TREK yazdıklarınızla depoya bağlanır ve alt bilgide “Ulaşıldı, şu hesapla oturum açıldı:” ve ardından hesabın adı yazar. Kimlik bilgileri reddedilirse ya da adrese ulaşılamazsa alt bilgide bunun yerine hata gösterilir. Her iki durumda da hiçbir şey kaydedilmez.',
  'help.guide.files-sync.step.5':
    '“Bağlan”a tıklayın. Bağlantı seyahatle birlikte kaydedilir ve TREK, seyahatin belgelerinin depoda nerede duracağını sorar: onları tutan etiket, klasör ya da alan. Yalnızca orada olanlar eşitlenir. “Yeni bir tane oluştur”, “Oluştur”a tıkladığınızda seyahatin başlığından alınan bir adla yeni bir tane oluşturur. “Ya da var olanlardan birini kullanın” altında mevcut olanları görürsünüz. Birine tıklayın; burada “Japonya’da Sonbahar” klasörüne.',
  'help.guide.files-sync.step.6':
    'Pencere yeniden açılır: deponuz solda “Bu gezi” altında listelenir; sağdaki kartında nereye eşitlendiği, en son ne zaman çalıştığı ve “Şimdi eşitle” görünür. İlk eşitleme kendiliğinden başlar; istediğiniz zaman bir eşitleme çalıştırmak için “Şimdi eşitle”ye tıklayın. Eşitlemeden sonra adın yanındaki “Henüz eşitlenmedi” rozeti yeşil bir noktaya döner; üzerine gelince “Eşit durumda” yazar. Akış çubuğu TREK’te ve depoda kaçar belge olduğunu gösterir; ikisinin arasında “Depoya giden” ve “Depodan gelen” şeritleri bulunur. Pencereyi sağ üstteki × ile kapatın.',
  'help.guide.files-sync.result':
    'Depoda zaten bulunan belgeler listenin başında, sizin adınıza yüklenmiş olarak görünür. “İşbirliği Notları” belgeleri hariç seyahatin her belgesi depoda da bulunur. Bundan sonra TREK depoyu arka planda denetler ve listedeki değişiklikler depoya kopyalanır.',
  'help.guide.files-sync.tip.1':
    'Seyahati yalnızca seyahatin sahibi ya da örnek yöneticisi bağlayabilir, çünkü kimlik bilgileri depodaki hesabın tamamına erişim verir. Seyahat bağlandıktan sonra her üye “Belge eşitleme”yi görür, açabilir, kartı okuyabilir ve “Şimdi eşitle” düğmesine basabilir.',
  'help.guide.files-sync.tip.2':
    'Kendi ağınızdaki bir depo için TREK sunucusunda ALLOW_INTERNAL_NETWORK=true ayarı gerekir ve adres, makinenin ağdaki adresi olmalıdır, asla localhost olmamalıdır. Bu olmadan “Bağlantıyı test et”, “Bu adrese izin verilmiyor.” yanıtını verir.',
  'help.guide.files-sync.tip.3':
    '“Şimdi eşitle”nin yanındaki simge olan “Bağlantıyı kes” bir kez onay ister. Sonra bağlantıyı sonlandırır ve her iki tarafta da tüm belgeleri korur. Bir etiketi, klasörü ya da alanı ikinci kez bağlarsanız TREK onu yeni sayar ve içindeki her şeyi yeniden içe aktarır. Bu yüzden “Bağlantıyı kes”ten sonra eskisini değil, boş bir tane bağlayın.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Gün ayrıntıları',
  'help.ctx.trip-day-detail.summary':
    'Bir gün başlığına tıkladığınızda haritanın üzerinde açılan panel. Günü bir bütün olarak gösterir: adı ve tarihi, bulunacağınız yerdeki hava durumu, o günkü rezervasyonlar ve o gün için ayrılan geceler.',
  'help.ctx.trip-day-detail.bullet.1':
    "Gün sütununda bir günün başlığına tıkla; panel haritanın ortasında açılır. Paneli kapatıp günün seçimini kaldırmak için aynı başlığa tekrar ya da sağındaki X'e tıkla. Yerler sütunundan veya haritadan bir yer açmak paneli kapatır ve onun yerine yeri gösterir.",
  'help.ctx.trip-day-detail.bullet.2':
    'Başlıkta günün adı ve tarihi görünür. Adın yanındaki kalem günü yeniden adlandırır. Çift ok, paneli dar bir çubuğa daraltır; böylece haritayı yeniden görebilirsiniz.',
  'help.ctx.trip-day-detail.bullet.3':
    'En üstte günün hava durumunu görürsünüz. “Tahmin yeri” tahminin hangi yer için olduğunu gösterir: günün ilk durağı ya da uyandığınız otel.',
  'help.ctx.trip-day-detail.bullet.4':
    '“Rezervasyonlar” o günün rezervasyonlarını listeler; her birinde türü, ait olduğu durak ve saatleri görünür. Yeşil onaylandı, kehribar henüz beklemede demektir; toplu taşıma yolculuğu mavidir ve durumu yoktur. Bir satıra tıklamak rezervasyonu açar.',
  'help.ctx.trip-day-detail.bullet.5':
    '“Konaklama”, bu günü kapsayan tüm geceleri gösterir; giriş ve çıkış yapılan günlerde “Giriş” ve “Çıkış yapmak”, giriş aralığı, çıkış saati ve onay numarası görünür. Konaklamanın rezervasyonu varsa altındaki “Rezervasyon” kutusunda rezervasyonun adı ve “Beklemede” ya da “Onaylandı” yazar. Rezervasyonu açmak için kutuya tıkla.',
  'help.ctx.trip-day-detail.bullet.6':
    "Konaklama ekle, bu güne bir gecelik konaklama ekler: tesisi seyahatin yerleri arasından seçin, hangi günleri kapsadığını belirleyin, saatleri ve kodu girin. Bir günün başlığındaki + simgesinin ipucu Güne ekle'dir; onun içinde de Konaklama ekle vardır ve bu paneli form zaten açık olarak getirir.",
  // day-panel
  'help.guide.day-panel.title': 'Bir günü açın ve ayrıntılarını okuyun',
  'help.guide.day-panel.goal':
    'Bir günün tamamını, havasını, rezervasyonlarını ve nerede kalacağınızı haritadan ayrılmadan görün.',
  'help.guide.day-panel.step.1':
    'Günler sütununda bir günün başlığına tıklayın. Gün seçilir ve ayrıntıları haritanın ortasında açılır.',
  'help.guide.day-panel.step.2': 'Başlıkta günün adı ve altında tarihi görünür. Ad vermediyseniz “1. gün” yazar.',
  'help.guide.day-panel.step.3':
    'Günün hava durumu en üsttedir. “Tahmin yeri” tahminin hangi yer için olduğunu gösterir: günün ilk durağı ya da önceki geceyi geçirdiğiniz otel.',
  'help.guide.day-panel.step.4': 'Altındaki “Rezervasyonlar”, bu güne denk gelen rezervasyonları saatleriyle listeler.',
  'help.guide.day-panel.step.5':
    '“Konaklama”, bu güne denk gelen geceleri gösterir; gerçekleştikleri günlerde “Giriş” ve “Çıkış” ile.',
  'help.guide.day-panel.step.6':
    'Başlıktaki çift ok paneli dar bir çubuğa daraltır. Yanındaki X paneli kapatır ve günün seçimini kaldırır.',
  'help.guide.day-panel.result':
    'Paneli çubuğa küçültürseniz harita boşalır ve gün seçili kalır. Paneli kapatırsanız gün seçimden çıkar ve plan olduğu gibi kalır.',
  'help.guide.day-panel.tip.1':
    'Panelin başlık çubuğunun herhangi bir yerine tıklamak da paneli daraltır. Ok simgesi bunun yalnızca bir yoludur.',
  'help.guide.day-panel.tip.2':
    'Bir yeri yer sütunundan ya da haritadan açtığınızda günün paneli kapanır ve yerin ayrıntıları gösterilir. Günü yeniden görmek için günün başlığına tekrar tıklayın.',
  // day-weather
  'help.guide.day-weather.title': 'Günün hava durumunu okuyun',
  'help.guide.day-weather.goal': 'O gün gerçekten bulunduğunuz yerin hava durumunu görün.',
  'help.guide.day-weather.step.1':
    '“Tahmin yeri” rakamların hangi yer için olduğunu gösterir: günün ilk durağı ya da durağı olmayan bir günde, önceki geceyi geçirdiğiniz otel.',
  'help.guide.day-weather.step.2':
    'Büyük sayı günün sıcaklığıdır. Yanında en düşük ve en yüksek değer ile hava durumu yazıyla görünür.',
  'help.guide.day-weather.step.3':
    'Sağındaki etiketler: yağış ihtimali, yağış miktarı, en güçlü rüzgâr, gün doğumu ve gün batımı.',
  'help.guide.day-weather.step.4':
    "En altta gün saat saat gösterilir, iki saatte bir: saat, simge, sıcaklık ve yağmur ihtimali. Yüzde 50'nin üzerindeki saatler mavi renklendirilir.",
  'help.guide.day-weather.result':
    'Günler sütunundaki günün kartında da numaranın altında küçük yazıyla hava durumu görünür, böylece tüm seyahatin havasını hızlıca görebilirsiniz.',
  'help.guide.day-weather.tip.1':
    "Derece ve rüzgâr, Ayarlar'da “Görünüm” altındaki “Sıcaklık Birimi” ayarını kullanır: °F Fahrenheit'i seçerseniz aynı tahmin °F ve mph ile gösterilir.",
  'help.guide.day-weather.tip.2':
    'Konumu belli bir durağı ve önceki geceden oteli olmayan bir gün için hiç hava durumu gösterilmez: tahmin her zaman bir yer içindir, seyahat için değil.',
  'help.guide.day-weather.tip.3':
    '16 günden daha ileri için tahmin yoktur. O zaman rakamlar, o tarih için önceki yılların ortalamalarıdır. Ø ile işaretlenir ve altında bunu belirten bir not yer alır.',
  // rename-day
  'help.guide.rename-day.title': 'Güne ad verin',
  'help.guide.rename-day.goal': 'Bir güne “5. gün” yerine “Kyoto’ya varış” ya da “Dinlenme günü” gibi bir ad verin.',
  'help.guide.rename-day.step.1': 'Günü açın. Başlıkta “5. gün” yazar, altında tarih bulunur.',
  'help.guide.rename-day.step.2': 'Adın yanındaki kaleme tıklayın.',
  'help.guide.rename-day.step.3': 'Ad bir alana dönüşür. İstediğiniz adı yazın.',
  'help.guide.rename-day.step.4':
    'Enter’a basın ya da başka bir yere tıklayın. Escape değişikliği iptal eder. Günler sütunundaki gün kartında da yeni ad görünür.',
  'help.guide.rename-day.result':
    'Yeni ad panelde ve günler sütunundaki gün kartında “5. gün” yerine geçer; tarih değişmez.',
  'help.guide.rename-day.tip.1': 'Alanı boşaltıp kaydederseniz gün yeniden “5. gün” olur: ad yoksa numara görünür.',
  'help.guide.rename-day.tip.2':
    'Ad güne aittir, tarihine değil. Günleri yeniden sıralarsanız ad, o günün diğer her şeyiyle birlikte taşınır.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Bir güne konaklama ekleyin',
  'help.guide.add-accommodation.goal': 'Oteli plana bir kez ekleyin: kapsadığı günler, saatleri ve onay numarasıyla.',
  'help.guide.add-accommodation.step.1':
    'Tesisin önce seyahatin bir yeri olması gerekir. Onu yerler sütununda diğer yerler gibi oluşturun: seçici yalnızca var olan yerleri sunar.',
  'help.guide.add-accommodation.step.2': 'Vardığınız günü açın ve “Konaklama” altında “Konaklama ekle”ye tıklayın.',
  'help.guide.add-accommodation.step.3':
    '“Günlere uygula”, konaklamanın hangi geceleri kapsadığını belirler: “Başlangıç” giriş günü, “Son” çıkış günüdür; “Tümü” ise tüm seyahati kapsar. İletişim kutusunun üstünde tarih aralığı ve gece sayısı görünür.',
  'help.guide.add-accommodation.step.4':
    '“Giriş”, “Kadar” ve “Çıkış” alanlarını doldurun ve rezervasyon numarasını “Onay kodu” altına yazın. Dördü de boş kalabilir.',
  'help.guide.add-accommodation.step.5':
    'Konaklama seçin altında tesisi seçin. Listenin üstündeki Kategori listeyi tek bir kategoriye daraltır.',
  'help.guide.add-accommodation.step.6': '“Kaydet”e tıklayın.',
  'help.guide.add-accommodation.result':
    'Konaklama kapsadığı her günde görünür; ilk günde “Giriş”, son günde “Çıkış yapmak” olarak. Tesis giriş gününde bir durak olur, böylece harita oraya giden rotayı gösterir ve “Rezervasyonlar” sekmesinde bir Otel rezervasyonu belirir.',
  'help.guide.add-accommodation.tip.1':
    'Seçici, geldiğiniz günde açılır ve çıkış ertesi güne ayarlıdır. Kaydetmeden önce ikisini de değiştirebilirsiniz.',
  'help.guide.add-accommodation.tip.2':
    'Oteli oluştururken ona “Hotel” kategorisini verin. Böylece listenin üstündeki “Kategori” tek tıkla yalnızca otellerinizi gösterir.',
  'help.guide.add-accommodation.tip.3':
    'Tüm saatler isteğe bağlıdır: girişi ve kodu olmayan bir konaklama da gecelerini kapsar ve rotası yine çizilir.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Ayrılmış bir geceyi değiştirin ya da iptal edin',
  'help.guide.edit-accommodation.goal': 'Bir konaklamayı taşıyın, saatlerini düzeltin ya da plandan çıkarın.',
  'help.guide.edit-accommodation.step.1':
    'Kartta tesis ve adresi, giriş ve çıkış yapılan günlerde saatleriyle “Giriş” veya “Çıkış yapmak”, onay numarası ve “Rezervasyon” altında konaklamayla birlikte gelen rezervasyon görünür.',
  'help.guide.edit-accommodation.step.2':
    'Sağındaki kalem (Konaklamayı düzenle), konaklamayı düzenlemeye açar. Açılan pencerenin başlığı artık Konaklamayı düzenle olur.',
  'help.guide.edit-accommodation.step.3':
    '“Giriş”, “Kadar”, “Çıkış” ve “Onay kodu”nu düzeltin. Üstlerindeki günler ve alttaki tesis de buradan değiştirilebilir.',
  'help.guide.edit-accommodation.step.4': '“Kaydet”e tıklayın.',
  'help.guide.edit-accommodation.step.5':
    'Kalemin yanındaki X (Kaldır) konaklamayı kaldırır. Onay sormaz ve konaklamaya ait Otel rezervasyonu da silinir.',
  'help.guide.edit-accommodation.result':
    'Değişiklik, konaklamanın kapsadığı her güne ve Rezervasyonlar sekmesindeki Otel rezervasyonuna anında uygulanır.',
  'help.guide.edit-accommodation.tip.1':
    'Konaklamanın ortasındaki bir gecede “Giriş” ve “Çıkış” etiketi yoktur: yalnızca aralığın ilk ve son gününde bulunur.',
  'help.guide.edit-accommodation.tip.2':
    'Bir konaklamayı iptal etmek, giriş gününe eklediği durağı ve rezervasyonuna bağlı tüm maliyetleri de kaldırır. Yanlışlıkla olduysa geceyi yeniden ekleyin.',
  // day-bookings
  'help.guide.day-bookings.title': 'Günün rezervasyonları tek bakışta',
  'help.guide.day-bookings.goal': 'Bu gün için nelerin ayrıldığını ve onaylanıp onaylanmadığını tek yerde görün.',
  'help.guide.day-bookings.step.1':
    '“Rezervasyonlar” günün rezervasyonlarını listeler: o güne tarihlenenler ve duraklarından birine sabitlenenler. Başka bir gündeki bir durağa sabitlenmiş rezervasyon yalnızca o durakta görünür.',
  'help.guide.day-bookings.step.2':
    'Satırda rezervasyonun türü, adı ve bir durağa aitse o durağın adı gri olarak görünür. Saatleri sağ uçta, durum noktasından önce yer alır.',
  'help.guide.day-bookings.step.3':
    'Renk, rezervasyonun durumunu gösterir: yeşil onaylandı, kehribar henüz beklemede; toplu taşıma yolculuğu mavidir ve durumu yoktur. Oteller bu listede yer almaz, aşağıda kendi bölümleri vardır.',
  'help.guide.day-bookings.step.4':
    'Bir satıra tıkla, rezervasyon açılır. Başlığındaki etiket rezervasyonu “Beklemede” ile “Onaylandı” arasında değiştirir; en alttaki “Düzenle” geri kalanı değiştirir. Yeni rezervasyonlar “Rezervasyonlar” sekmesinde, ulaşımlar “Ulaşım” sekmesinde oluşturulur.',
  'help.guide.day-bookings.result': 'O güne tarihli her şey ve duraklarından birine bağlı her şey bu listededir.',
  'help.guide.day-bookings.tip.1':
    'Rezervasyon, kendi tarihindeki günde görünür. Rezervasyonlar ya da Ulaşım sekmesinde tarihi değiştirirseniz rezervasyon kendiliğinden öbür güne taşınır.',
  'help.guide.day-bookings.tip.2':
    '“Rezervasyonlar” bloğu yoksa günün rezervasyonu yok demektir: boş gösterilmek yerine gizlenir.',
  'help.guide.map-lock.title': 'Haritayı kilitleyin',
  'help.guide.map-lock.goal': 'Günler ve yerler arasında gezinirken haritayı bulunduğu yerde tutun.',
  'help.guide.map-lock.step.1':
    'Kilit, haritanın sol altındaki iki yuvarlak düğmenin üstteki olanıdır. Üzerine gelince Harita görünümünü kilitle yazar. Ona tıklayın. Kilit kapalıyken bir günü açmak ya da bir yer seçmek haritayı artık yakınlaştırmaz veya kaydırmaz; düğmede Harita seçimi takip etsin yazar.',
  'help.guide.map-lock.result': 'Planı düzenlerken harita bıraktığınız yerde kalır.',
  'help.guide.map-lock.tip.1':
    'Kilide yeniden tıklayın (artık Harita seçimi takip etsin yazar), harita seçtiğiniz şeyi yeniden izler. Kilit yalnızca bilgisayarda bulunur. Telefonda harita her zaman seçimi izler.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Harita',
  'help.ctx.trip-map.summary':
    'Planın ortası: seyahatteki her yer bir iğne, her tur bir çizgi olarak görünür; aralarındaki rotalar da çizilir. Haritanın kenarlarındaki düğmelerle görünümü kilitleyebilir, uyduya geçebilir, tüm seyahati tek seferde görebilir ve baktığınız bölgedeki yerleri gösterebilirsiniz.',
  'help.ctx.trip-map.bullet.1':
    'Bir iğne bir yerdir: yerin kendi fotoğrafı varsa o, yoksa kategori simgesiyle kategori rengi görünür. İğnenin üzerine gelince resmi, adı ve adresi, varsa puanı ve kategorisiyle bir kart açılır. Yeri bir güne planlamak için iğneyi gün kartının üzerine sürükleyin. Rezervasyonu hâlâ beklemede olan bir konaklama soluk ve kesikli halkayla gösterilir.',
  'help.ctx.trip-map.bullet.2':
    'Birbirine çok yakın iğneler, sayı yazan tek bir koyu daire içinde toplanır. Daireye tıklarsanız harita içindeki iğnelere yakınlaşır. Ayarlar > Görünüm içinde Seyahat ve harita altında Planlanmamış yerler için küçük işaretler açıkken henüz hiçbir günde olmayan yerler fotoğrafsız küçük noktalar olarak görünür, böylece planlanan duraklar daha kolay seçilir.',
  'help.ctx.trip-map.bullet.3':
    'Yeri haritanın altındaki bir kartta açmak için bir iğneye tıklayın. Kartta puanı, dosyaları ve sonraki eylemler görünür. Kartı kapatmak için haritanın boş bir yerine tıklayın.',
  'help.ctx.trip-map.bullet.4':
    'Gün sütununda bir gün açıkken o günün durakları, günlük sıra numaralarını gösteren küçük beyaz bir rozet taşır. Günde iki kez yer alan bir yerde iki numara da görünür. Yerler listesinin üstündeki filtreler (“Göster”, kategoriler ve asgari puan için yıldız) haritadaki iğneleri de filtreler.',
  'help.ctx.trip-map.bullet.5':
    'Üstteki simge satırı haritanın görünen kısmında arama yapar: Restoranlar, Kafeler, Bar ve gece hayatı, Konaklama, Gezilecek yerler, Müzeler ve kültür, Doğa ve parklar ve Etkinlikler. Eklentilerin eklediği kategoriler ince bir ayırıcı çizgiden sonra gelir. Satır haritadan genişse fare tekerleği satırı yana kaydırır. “Bu alanda ara”, haritayı hareket ettirdikten sonra aramayı yeniden çalıştırır.',
  'help.ctx.trip-map.bullet.6':
    'Yer formunu o noktada, adres önceden aranmış olarak açmak için haritanın herhangi bir yerine sağ tıkla. Sol altta iki yuvarlak düğme vardır: kilit düğmesi (“Harita görünümünü kilitle”) gün ve yerler arasında gezinirken harita görünümünü olduğu yerde tutar; altındaki düğme (“Uydu görünümüne geç”) çizili haritayı uydu görüntüleriyle değiştirir.',
  'help.ctx.trip-map.bullet.7':
    'Sağ alttaki “Tüm geziyi göster”, tüm seyahat günlerini aynı anda çizer ve her günün neleri kapsadığını listeler. Bir rezervasyon satırındaki rota simgesi o rezervasyonu, günlerin üstündeki araç çubuğundaki rota simgesi ise tüm rezervasyonları çizer. Ayrıntılarını açmak için çizilmiş bir rezervasyonun ucuna tıklayın.',
  'help.ctx.trip-map.bullet.8':
    'Dawarich eklentisi açıkken “Tüm geziyi göster” altındaki yuvarlak Dawarich düğmesi, telefonunuzun gerçekten kaydettiği rotayı gösterir. “Kaydedilen rotayı göster” bunu planlanan rotanın altına kesik çizgiyle, her gün için ayrı bir renkte çizer. Çizgi yoksa düğmenin etiketi nedenini söyler.',
  // map-markers
  'help.guide.map-markers.title': 'Haritayı okuyun',
  'help.guide.map-markers.goal': 'Haritadaki her iğnenin, rozetin ve baloncuğun ne anlama geldiğini öğrenin.',
  'help.guide.map-markers.step.1':
    'Harita seyahatin tüm yerlerini gösterir. Birbirinden ayırt edilemeyecek kadar yakın iğneler, içlerindeki iğne sayısını gösteren tek bir koyu daire halinde toplanır. Daireye tıklayın: harita o iğnelere yakınlaşır ya da en yakın yakınlaştırma düzeyinde iğneleri birbirinden ayırır.',
  'help.guide.map-markers.step.2':
    'İğne, yerin kendi fotoğrafı varsa onu, yoksa kategori simgesiyle birlikte kategori rengini gösterir. Rezervasyonu hâlâ beklemede olan bir konaklama soluk ve kesikli halkayla çizilir. İğnenin üzerine gelince yanında bir kart açılır: aynı fotoğraf daha büyük, ad ve adres; yerin puanı ve kategorisi varsa onlar da.',
  'help.guide.map-markers.step.3':
    "Bir iğneye tıklayın, yer haritanın altında bir kartta açılır: üstte resim, ad ve adres, sonra yıldızlar, açıklama ve rezervasyonunun dosyaları dahil dosyalar. En altta işlemler yer alır: bir gün açıkken Güne Ekle (yer o günde zaten varsa Günden Kaldır), Navigasyon, Web Sitesini Aç, Koleksiyona kaydet (bir koleksiyondaysa Kaydedildi) ve sağda çöp kutusu ile Düzenle. Üstteki X'e ya da haritanın boş bir yerine tıklamak kartı kapatır.",
  'help.guide.map-markers.step.4':
    'Günler sütununda bir günü açın, durakları numaralanır: iğnenin köşesindeki küçük beyaz rozet, durağın gün içindeki sırasını gösterir. Günde iki kez geçen bir yerde iki numara da görünür. Açık gün yoksa numara görünmez ve köşede, varsa yerin puanı gösterilir.',
  'help.guide.map-markers.step.5':
    'Bir iğneyi haritadan günler sütunundaki bir gün kartının üzerine sürükleyin, yer o güne planlanır. Yerler listesindeki satırını sürüklemekle aynı sonucu verir.',
  'help.guide.map-markers.result':
    'Seyahatte hiçbir şey değişmedi: harita yalnızca seyahati gösterir. Her iğne hangi yer olduğunu, hangi günde olduğunu ve hangi sırada geldiğini gösterir.',
  'help.guide.map-markers.tip.1':
    'Günler sütununda bir günü daraltırsanız durakları haritada da gizlenir. Göstermek için günü yeniden genişletin.',
  'help.guide.map-markers.tip.2':
    'Yer listesinin üstündeki filtreler haritada nelerin görüneceğini de belirler: Göster (Planlanmamış, Planlandı), etiket düğmesi altındaki kategoriler ve yıldız altındaki asgari puan iğne sayısını azaltır. Ülke filtresi ise yalnızca listeyi daraltır.',
  'help.guide.map-markers.tip.3':
    'Bu haritada yakınlaştırma düğmesi yoktur: tekerlek yakınlaştırır, çift tıklama bir adım yakınlaştırır, haritayı sürüklemek ise onu kaydırır.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Haritada çevrenizdeki yerleri bulun',
  'help.guide.map-nearby-places.goal':
    'Haritada görünen şehir bölümünde restoran, gezilecek yer ya da otel arayın ve birini seyahate ekleyin.',
  'help.guide.map-nearby-places.step.1':
    'Haritanın üstündeki simge satırı kategori aramasıdır: Restoranlar, Kafeler, Bar ve gece hayatı, Konaklama, Gezilecek yerler, Müzeler ve kültür, Doğa ve parklar ve Etkinlikler. Eklentilerin eklediği kategoriler ince bir ayırıcıdan sonra gelir; adını görmek için bir simgenin üzerine gel.',
  'help.guide.map-nearby-places.step.2':
    'Bir kategoriye tıklayın. TREK, haritanın görünen bölümünde o türden yerleri arar ve her sonuç için kategorinin renginde bir iğne koyar. Aynı anda yalnızca bir kategori seçilebilir: başka birine tıklamak seçimi değiştirir, etkin olana tıklamak kapatır.',
  'help.guide.map-nearby-places.step.3':
    'Haritayı kaydırdığınızda satırın altında ikinci bir düğme belirir: “Bu alanda ara”, aynı aramayı yeni görünüm için çalıştırır. Haritayı kaydırmak kendiliğinden yeni arama başlatmaz, böylece istek sayısı düşük kalır.',
  'help.guide.map-nearby-places.step.4':
    'Aramanın bulduğu yerin adını görmek için işaretçiyi bir iğnenin üzerine getir. İğneye tıkla; yer formu ayrıntılar doldurulmuş olarak açılır: pencere başlığında ad, “Adres”, “Enlem” ve “Boylam” ile arama bulduysa web sitesi ve telefon numarası.',
  'help.guide.map-nearby-places.step.5':
    'Doldurulanları kontrol et ve aramanın bilemeyeceği bilgileri ekle. Seyahatte uygun bir kategori varsa, örneğin restoran için restoran kategorisi, adın altındaki kategori etiketi zaten seçilidir; yoksa sen seçene kadar “Kategori Yok” yazar. Kendi “Açıklama”nı ve notlarını ekle.',
  'help.guide.map-nearby-places.step.6':
    '“Ekle”ye tıklayın. Aynı adlı ya da aynı noktadaki bir yer seyahatte zaten varsa TREK bunu bildirir ve düğme “Yine de ekle” olur.',
  'help.guide.map-nearby-places.result':
    'Yer, yerler listesinde ve haritada seyahatin kendi iğnelerinden biri olarak görünür; bir güne eklenene kadar “Planlanmamış” altında durur. Arama iğneleri, kategoriyi kapatana kadar kalır.',
  'help.guide.map-nearby-places.tip.1':
    '“Ayarlar” > “Genel” içinde “Seyahat ve harita” altında “Haritada yerleri keşfet” kapalıysa bu satır gizlenir.',
  'help.guide.map-nearby-places.tip.2':
    'Sonuçlar TREK Places dizininden ve OpenStreetMap’ten gelir; bu yüzden bu, plandaki bağlantı gerektiren birkaç işlemden biridir.',
  'help.guide.map-nearby-places.tip.3':
    'Arama yalnızca ekrandaki alanı kapsar; bu yüzden ilgilendiğiniz sokağa yakınlaştırın. Bütün bir şehir üzerinde yapılan arama, belirli bir sıra olmadan yalnızca ilk altmış sonucu verir.',
  // map-add-place
  'help.guide.map-add-place.title': 'Haritaya sağ tıklayarak yer oluşturun',
  'help.guide.map-add-place.goal': 'Önce aramadan, bir yeri tam istediğiniz noktaya ekleyin.',
  'help.guide.map-add-place.step.1':
    'Haritada istediğiniz noktaya sağ tıklayın. Yer formu “Yer/etkinlik Ekle” başlığıyla açılır.',
  'help.guide.map-add-place.step.2':
    '“Enlem” ve “Boylam” zaten o noktaya ayarlıdır. TREK koordinatları arar ve orada bulduğu bilgiyle “Adres” alanını doldurur. Arama bir ad bulursa pencerenin üstündeki ad alanını da doldurur. Henüz hiçbir şey kaydedilmedi, yanlış olanı düzeltin.',
  'help.guide.map-add-place.step.3':
    'İletişim kutusunun üstündeki alana tanıyacağınız bir ad yazın. Altındaki rozetten bir kategori seçin; siz seçene kadar “Kategori Yok” yazar. Sonra plan için gereken diğer bilgileri ekleyin: “Açıklama”, “Notlar”, “Web sitesi”.',
  'help.guide.map-add-place.step.4':
    '“Ekle”ye tıklayın. Bir gün açık olsa bile yer listeye planlanmamış olarak eklenir: haritaya sağ tıklamak konumu belirler, günü değil.',
  'help.guide.map-add-place.result':
    'Yer listede ve haritadadır; bir güne ekleyene kadar “Planlanmamış” altında durur.',
  'help.guide.map-add-place.tip.1':
    'Adres koordinatlardan sorgulanır; bu yüzden ad yerine bir sokak gösterebilir ve açık arazide boş olabilir. Her iki alanın üzerine de yazabilirsiniz.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL ve Mapbox GL haritalarında orta tıklama da aynı işi yapar, dokunmatik ekranda ise uzun basma.',
  // map-satellite
  'help.guide.map-satellite.title': 'Uyduya geçin',
  'help.guide.map-satellite.goal': 'Çizilmiş haritadan hava görüntülerine geçin ve geri dönün.',
  'help.guide.map-satellite.step.1':
    'Temel katman anahtarı, haritanın sol altındaki iki yuvarlak düğmenin alttakidir, kilidin altındadır. Simgesi her zaman geçeceği katmanı gösterir, ipucu da hangisi olduğunu söyler: Uydu görünümüne geç. Ona tıklayın.',
  'help.guide.map-satellite.step.2':
    'Harita artık hava görüntüsü gösterir. Tek tek binaları görecek kadar ayrıntılıdır ve kendi anahtarınıza gerek yoktur. TREK’in çizdiği her şey üstte kalır: iğneler, günün rotası, izler ve rezervasyon rotaları.',
  'help.guide.map-satellite.step.3':
    'Düğmede artık “Harita görünümüne geç” yazar. Harita görünümüne dönmek için ona tıklayın.',
  'help.guide.map-satellite.result': 'Harita yeniden çizilir ve seçtiğiniz katman hesabınızda hatırlanır.',
  'help.guide.map-satellite.tip.1':
    'Seçim seyahate değil hesabınıza kaydedilir; bu yüzden hangi harita motorunu kullanırsanız kullanın her seyahat bıraktığınız gibi açılır.',
  'help.guide.map-satellite.tip.2':
    'Uydu görüntülerinde yazı yoktur: sokak adları, semtler ve kapı numaraları yalnızca çizilmiş haritada bulunur. Adres ararken çizilmiş haritaya dönün.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Tüm seyahati ve mesafelerini görün',
  'help.guide.map-whole-trip.goal':
    'Yalnızca açık günü değil, seyahatin tüm seyahat günlerini gösterin ve her gün ne kadar yol aldığınızı görün.',
  'help.guide.map-whole-trip.step.1':
    'Yuvarlak “Tüm geziyi göster” düğmesi haritanın sağ alt köşesindedir. Tıklayın: seyahatin her seyahat günü aynı anda, her biri kendi renginde çizilir; böylece komşu günleri birbirinden ayırabilirsiniz.',
  'help.guide.map-whole-trip.step.2':
    'Düğmenin üstündeki kart bu günleri listeler: renkli bir nokta, günün adı, o günkü her ulaşım türü için bir simge ve kat edilen mesafe. “Toplam mesafe” en üsttedir.',
  'help.guide.map-whole-trip.step.3':
    'Seçmek için kartta bir güne tıklayın: satırı gölgelenir ve gün, günler sütununda açılır. Yakınlaştırmak için bir şehrin üzerinde fare tekerleğini çevirin. Şehirden geçen günler, her biri kendi renginde, yan yana gösterilir.',
  'help.guide.map-whole-trip.step.4':
    'Düğmede artık “Tüm geziyi gizle” yazar. Yalnızca açık günü yeniden göstermek için ona tıklayın.',
  'help.guide.map-whole-trip.result':
    'Her seyahat günü kendi renginde çizilir; kart da her günün neyi kapsadığını ve seyahatin toplamını gösterir.',
  'help.guide.map-whole-trip.tip.1':
    'Toplam birkaç etap birden hesaplanır. Sayının ardında … görünürken sayı yalnızca kısmi bir toplamdır. Tüm etaplar hesaplandığında kesinleşir.',
  'help.guide.map-whole-trip.tip.2':
    'Rota motoru bir etabı hesaplayamazsa o etap düz çizgi olarak kalır ve sayılmaz. Kart bunu belirtir; böylece toplam uyarı olmadan düşük görünmez.',
  'help.guide.map-whole-trip.tip.3':
    'Konumlu durağı ikiden az olan ve oteline gidiş ya da otelinden dönüş sürüşü bulunmayan bir günün çizilecek rotası yoktur; bu yüzden kartta hiç görünmez.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Bir rezervasyonun rotasını haritada gösterin',
  'help.guide.map-booking-routes.goal':
    'Rezervasyonunu yaptığınız uçuşları, trenleri ve sürüşleri haritada gösterin ve yeniden kaldırın.',
  'help.guide.map-booking-routes.step.1':
    'Rezervasyon rotaları siz açana kadar kapalıdır. Günler sütununda bir ulaşım satırının sağ ucunda küçük bir rota simgesi vardır: “Rezervasyon rotalarını göster”.',
  'help.guide.map-booking-routes.step.2':
    'Tıkladığınızda rezervasyon haritada görünür: uçuş büyük daire yayı olarak, araç yolculuğu gerçek yollar boyunca, tren de istasyonlarının zinciri olarak. “Onaylandı” düz çizgiyle, “Beklemede” kesik çizgiyle çizilir; rotanın uçları ulaşım simgesi taşıyan mavi hap şeklinde etiketlerdir.',
  'help.guide.map-booking-routes.step.3':
    'Bir uç etiketine tıkla, rezervasyonun ayrıntıları açılır: renkli başlıkta durum, tür ve günler etiket olarak, iki uçtaki saatler, diğer bilgiler aşağıda ve en altta şunlar yer alır: bu rotayı yeniden kapatan “Haritada”, toplu taşıma bağlantısında “Rotayı değiştir”, rezervasyonu silen çöp kutusu ve “Düzenle”. Başlıktaki X ayrıntıları kapatır.',
  'help.guide.map-booking-routes.step.4':
    'Günlerin üstündeki araç çubuğundaki rota simgesi tüm seyahat için tek seferde çalışır: “Tüm rezervasyon rotalarını göster”, rotası olan her rezervasyonu çizer.',
  'help.guide.map-booking-routes.step.5':
    'Bu, önceki seçimlerinizin yerini alır; yani rezervasyon rezervasyon açtığınız rotalar sıfırlanır. Tüm rezervasyon rotalarını gizlemek için yeniden basın; düğmede artık “Tüm rezervasyon rotalarını gizle” yazar.',
  'help.guide.map-booking-routes.result':
    'İstediğiniz rezervasyonlar haritada çizilir. Seçim, siz değiştirene kadar bu seyahat için bu tarayıcıda saklanır.',
  'help.guide.map-booking-routes.tip.1':
    'Uçlarda havalimanı kodu veya istasyon adı yalnızca “Ayarlar” > “Genel” içinde “Seyahat ve harita” altında “Rezervasyon rota etiketleri” açıkken görünür; kapalıyken yalnızca simge görünür.',
  'help.guide.map-booking-routes.tip.2':
    'Aynı bölümdeki Rezervasyon rotalarını her zaman göster, bunu henüz kendiniz ayarlamadığınız her seyahatte rotaları baştan gösterir.',
  'help.guide.map-booking-routes.tip.3':
    'Bir rezervasyonun çizilebilmesi için koordinatlı bir başlangıç ve bitiş noktası gerekir, bu yüzden otel ya da restoranda rota simgesi yoktur.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Gerçekten gittiğiniz rotayı gösterin',
  'help.guide.map-dawarich-trail.goal':
    "Dawarich'in telefonunuzda kaydettiği rotayı haritada, planladığınız rotanın yanında kesik çizgiyle gösterin ve seyahatin gün gün gerçekte nasıl geçtiğini görün.",
  'help.guide.map-dawarich-trail.step.1':
    'Yuvarlak Dawarich düğmesi haritanın sağ altında, “Tüm geziyi göster” düğmesinin altındadır. Üzerine gelince “Kaydedilen rotayı göster” yazar. Tıklayın. TREK, seyahatin tarihleri için verileri Dawarich’inizden ister; yanıt beklenirken düğmenin çevresinde bir halka döner.',
  'help.guide.map-dawarich-trail.step.2':
    'Kaydedilen rota, her gün için ayrı renkte kesik çizgi olarak görünür; plan okunabilir kalsın diye planlanan rotanın altına çizilir. Düğmede artık “Kaydedilen rotayı gizle” yazar. Her gün yerel gece yarısında biter. Günler sütununda bir günü daraltırsanız kesik çizgisi ve durakları haritada gizlenir.',
  'help.guide.map-dawarich-trail.step.3':
    '“Tüm geziyi göster”e de tıklayın; planlanan her gün kesikli kaydın yanında düz çizgiyle çizilir. İki çizginin örtüştüğü yerde gün planlandığı gibi geçmiştir. Kesikli çizginin planlanan rotadan ayrıldığı yerde ise geçmemiştir.',
  'help.guide.map-dawarich-trail.result':
    'Planladığınız ve gerçekte yaptığınız rota haritada birlikte görünür: kesikli ve düz çizgiler olarak. Düğmelerin üstündeki kart planlanan günleri ve mesafelerini listelemeye devam eder.',
  'help.guide.map-dawarich-trail.tip.1':
    "Açık ya da kapalı olması her seyahat için hesabınıza kaydedilir, yani her tarayıcıda ve cihazda aynıdır. Rota açıkken TREK iki dakikada bir Dawarich'e yeniden sorar, böylece devam eden bir seyahat sayfayı yenilemeden güncellenir. Rotanın kendisi hiç saklanmaz: TREK veritabanında, yedeklerde yoktur ve çevrimdışı kullanılamaz.",
  'help.guide.map-dawarich-trail.tip.2':
    'Düğmenin etiketi haritanın neden boş olduğunu söyler: yüklenirken “Kaydedilen rota yükleniyor…”, “Bu tarihlerde hiçbir şey kaydedilmemiş”, “Kaydedilen rota yüklenemedi” ya da TREK çevrimdışıyken “Kaydedilen rota için bağlantı gerekir”.',
  // map-compass
  'help.guide.map-compass.title': 'Haritayı döndürün ve kuzeyi yeniden bulun',
  'help.guide.map-compass.goal':
    'Haritayı gittiğiniz yöne bakacak şekilde döndürün ve tek tıkla yeniden kuzeye çevirin.',
  'help.guide.map-compass.step.1':
    'Haritayı sağ tuşla sürükleyerek ya da Ctrl tuşunu basılı tutup sol tuşla sürükleyerek döndürün; dokunmatik ekranda iki parmağınızı çevirin. Haritanın üstündeki kategori simgeleri sırasının yanındaki yuvarlak pusula da onunla birlikte döner: oku her zaman kuzeyi gösterir, bu yüzden harita kadar eğilir.',
  'help.guide.map-compass.step.2':
    'Pusulaya tıklayın. “Reset north” adlı düğme haritayı kuzey üstte olacak şekilde geri çevirir, görünümü yeniden düzleştirir ve ok yeniden yukarıyı gösterir.',
  'help.guide.map-compass.result':
    'Harita yeniden kuzeye bakar ve düzdür. Seyahatte hiçbir şey değişmemiştir: pusula yalnızca görünümü değiştirir.',
  'help.guide.map-compass.tip.1':
    'Pusula yalnızca MapLibre GL ve Mapbox GL haritalarında bulunur. Leaflet haritası döndürülemez, bu yüzden pusulası yoktur. Hangi haritayı kullanacağınızı Ayarlar içinde Harita altındaki “Harita Sağlayıcısı” belirler, seçimi “Haritayı Kaydet” kaydeder.',
  'help.guide.map-compass.tip.2':
    "Tıklama eğimi de sıfırlar. Görünümü eğmek için sağ fare tuşuyla yukarı ya da aşağı sürükleyin; Reset north görünümü düzler ve dönüşü sıfırlar. “3D Binalar ve Arazi” açıkken Mapbox GL'de bu, yeniden eğene kadar 3D görünümü de düzleştirir.",

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'İş birliği',
  'help.ctx.trip-collab.summary':
    'Grubun birlikte plan yaptığı sekme, beş kartta: solda sohbet, yanında “Notlar” ve “Bağlantılar”, onların altında “Anketler” ve “What’s Next”. Buraya yazılan her şey, sayfayı yenilemeye gerek kalmadan, diğer her üyenin ekranında aynı anda görünür.',
  'help.ctx.trip-collab.bullet.1':
    'Sohbet soldaki karttır. “Mesaj yazın...” alanına yazıp Enter’a basın; Shift ve Enter yeni satır açar. Gülen yüz emoji ekler, “Görsel ekle” mesaja en fazla dört resim ekler.',
  'help.ctx.trip-collab.bullet.2':
    'Bir mesajın üzerine gelirseniz “Yanıtla” görünür, kendi mesajlarınızda ayrıca “Sil” de çıkar. Sekiz hızlı tepki için mesaja sağ tıklayın. Silinen bir mesajın yerine, onu kimin sildiğini belirten bir not görünür.',
  'help.ctx.trip-collab.bullet.3':
    "Notlar ortak not alanıdır: başlığındaki Yeni Not bir not oluşturur, yanındaki çark ise adları ve renkleri için Kategorileri Yönet'i açar. Kategoriler varsa başlığın altındaki bir etiket satırı kartları süzer: Tümü ya da tek bir kategori. Not kartında kategori renkli bir nokta, bağlantı yuvarlak bir düğme olarak görünür; üç nokta menüsü (Diğer seçenekler) Genişlet, Sabitle, Düzenle ve Sil seçeneklerini içerir.",
  'help.ctx.trip-collab.bullet.4':
    '“Bağlantılar”, seyahat için web adreslerini toplar. “Bağlantı ekle” bir başlık ve bir http ya da https adresi ister. “Bağlantıyı düzenle”, “Bağlantıyı sabitle” ve “Bağlantıyı sil” çipin sonunda yer alır; sabitlenen bağlantılar en önde kalır.',
  'help.ctx.trip-collab.bullet.5':
    'Karar vermek için anketleri kullanın. “Yeni Anket”, en az iki seçenekli bir soru sorar. Oy vermek için bir seçeneğe tıklayın. Anket başlığının sağındaki kilit (“Kapat”) ve çöp kutusu (“Sil”) oylamayı bitirir ya da anketi kaldırır.',
  'help.ctx.trip-collab.bullet.6':
    '“What’s Next” seyahatin hâlâ önünüzde olan duraklarını, en fazla sekiz tanesini, saatleri ve katılan kişilerle birlikte listeler. Yalnızca gün planını okur; saatler orada ayarlanır.',
  // write-note
  'help.guide.write-note.title': 'Ortak not yazın',
  'help.guide.write-note.goal':
    'Tüm grubun ihtiyaç duyduğu bir kuralı, adresi ya da hatırlatmayı herkesin bulabileceği yere koyun.',
  'help.guide.write-note.step.1':
    '“Notlar” kartının başlığındaki “Yeni Not”a tıklayın. Not penceresi, imleç zaten başlık alanında olacak şekilde açılır.',
  'help.guide.write-note.step.2':
    "Başlığı iletişim kutusunun üstünde “Not başlığı” yazan alana yazın. Zorunlu tek alan budur: başlıkta metin olana kadar “Oluştur” gri kalır ve başlıktayken Enter'a basmak notu hemen oluşturur.",
  'help.guide.write-note.step.3':
    '“İçerik” metni barındırır ve Markdown destekler: kalın bir sözcük, bir liste, bir başlık. Kart ilk üç satırı gösterir, menüsündeki “Genişlet” notun tamamını açar.',
  'help.guide.write-note.step.4':
    'Kategori altında notun ait olduğu kategoriyi seçin. Kategorinin rengi şimdi pencerenin başlığında, sonra kartın başlığında kullanılır. İlk kategori sizin için zaten seçilidir. Etiketler mevcut kategorilerdir, yenisini Kategorileri Yönet altında oluşturursunuz. Seyahatte henüz kategori yoksa bu satır görünmez.',
  'help.guide.write-note.step.5':
    '“Web sitesi”, nota ait bir bağlantı alır. Kartın üstünde bağlantıyı açan yuvarlak bir bağlantı düğmesi görünür.',
  'help.guide.write-note.step.6':
    '“Oluştur”a tıklayın. İletişim kutusunu yalnızca “İptal” ve çarpı işareti kapatır; bu yüzden dışına tıklamak ya da Esc yazdıklarınızı kaybettirmez.',
  'help.guide.write-note.result':
    'Not, “Notlar” panelinde üst kısmı kategorisinin renginde bir kart olarak görünür ve diğer tüm üyeler onu hemen görür.',
  'help.guide.write-note.tip.1':
    'Bir kartın üç noktası (“Diğer seçenekler”) “Genişlet”, “Sabitle”, “Düzenle” ve “Sil” seçeneklerini açar. “Sabitle” notu panelin en üstünde, kendi renginde bir çerçeveyle tutar. Diğer tüm notlar en son ne zaman değiştirildiklerine göre sıralanır.',
  'help.guide.write-note.tip.2':
    '“Yeni Not”un yanındaki dişli “Kategorileri Yönet”i açar. Orada bir kategoriye renk verebilir, onu her yerde birden yeniden adlandırabilir ya da henüz hiçbir not kullanmadan önce ekleyebilirsiniz. “Kaydet”e tıklayana kadar hiçbir şey değişmez.',
  'help.guide.write-note.tip.3':
    "“Dosya ekle”, seyahate dosya yükleme iznin varsa nota bir belge ekler. “Ekle” dosya seçiciyi açar; ayrıca bir resmi veya PDF'i pencereye yapıştırabilirsin.",
  'help.guide.write-note.tip.4':
    "Notlar, Eklentiler altında İş birliği'nin altında kendi anahtarına sahiptir: yönetici bunu kapatıp sohbetin, bağlantıların, anketlerin ve What’s Next bölümünün çalışmasını sürdürebilir.",
  // shared-links
  'help.guide.shared-links.title': 'Seyahatin bağlantılarını toplayın',
  'help.guide.shared-links.goal':
    'Rezervasyon portalını, ortak albümü ve tarifeyi tek yerde tutun, sohbette aramanız gerekmesin.',
  'help.guide.shared-links.step.1':
    '“Bağlantılar” kartının başlığındaki “Bağlantı ekle”ye tıklayın. İletişim kutusu, imleç en üstteki alanda olacak şekilde açılır.',
  'help.guide.shared-links.step.2':
    'Adı “Bağlantı başlığı” alanına yazın, adresi altındaki “Bağlantı” alanına yapıştırın, sonra “Bağlantıyı kaydet”e tıklayın.',
  'help.guide.shared-links.step.3':
    'Rozette ad ve bağlantının gittiği site görünür. Sayfayı yeni sekmede açmak için ona tıklayın.',
  'help.guide.shared-links.step.4':
    'Sonundaki üç yuvarlak düğme “Bağlantıyı düzenle”, “Bağlantıyı sabitle” ve “Bağlantıyı sil”dir. “Bağlantıyı sabitle” rozeti panelin en başına taşır ve vurgu renginde gösterir. “Bağlantıyı sil” önce onay ister, çünkü bağlantı her üye için kaldırılır.',
  'help.guide.shared-links.result':
    'Bağlantı, “Bağlantılar” panelinde en öne sabitlenmiş bir çip olarak görünür ve her üyenin ekranında anında belirir.',
  'help.guide.shared-links.tip.1':
    'Yalnızca http ya da https adresi kabul edilir. Başka her şey reddedilir ve pencere, yazdıklarınızla birlikte açık kalır.',
  'help.guide.shared-links.tip.2':
    "Önce sabitlenen bağlantılar, sonra en yeniler gelir. Başlığın yanındaki küçük simge sitenin kendi favicon'udur ve siteden yüklenir, bu yüzden internet yokken çip bunun yerine düz bir bağlantı simgesi gösterir.",
  'help.guide.shared-links.tip.3':
    '“Bağlantılar”ın “Eklentiler” altında, “İş birliği”nin altında kendi anahtarı vardır; böylece yönetici sekmenin geri kalanına dokunmadan paneli kapatabilir.',
  // create-poll
  'help.guide.create-poll.title': 'Gruba sorun',
  'help.guide.create-poll.goal':
    'Sohbette kimsenin yanıtlamadığı bir soruyu, herkesin oy verebileceği bir ankete dönüştürün.',
  'help.guide.create-poll.step.1': '“Anketler” kartının başlığındaki “Yeni Anket”e tıklayın. Pencere açılır.',
  'help.guide.create-poll.step.2':
    'Soruyu “Soru” alanına yazın. Kutunun altındaki “Markdown desteklenir” ifadesi, kalın yazının, satır sonunun ve kısa bir listenin burada çalıştığı anlamına gelir.',
  'help.guide.create-poll.step.3':
    '“Seçenekler” altında “Seçenek 1” ve “Seçenek 2” alanlarını doldurun. İçi boş olmayan en az iki seçenek gerekir, bir seçenek birkaç satır da olabilir.',
  'help.guide.create-poll.step.4':
    'Altlarındaki “Seçenek ekle” üçüncü, dördüncü ve ihtiyacınız kadar seçenek ekler. İkiden fazla seçenek olduğunda satırın yanında görünen küçük çarpı o seçeneği kaldırır.',
  'help.guide.create-poll.step.5':
    '“Çoklu seçim” herkesin birden fazla seçeneği işaretlemesine izin verir. Kapalıysa bir kişi başka bir seçenek seçtiğinde oyu yeni seçeneğe geçer.',
  'help.guide.create-poll.step.6': '“Anket Oluştur”a tıklayın.',
  'help.guide.create-poll.result': 'Anket, “Anketler” panelinin en üstünde açık olarak görünür; başlığında 0 oy yazar.',
  'help.guide.create-poll.tip.1': 'Soru Markdown olarak işlenir; seçenekler düz metin olarak kalır.',
  'help.guide.create-poll.tip.2': 'Bir soru ve metin içeren en az iki seçenek olana kadar “Anket Oluştur” gri kalır.',
  'help.guide.create-poll.tip.3':
    'Son tarih yalnızca telefon uygulamasında ayarlanabilir. Son tarihli bir ankette kalan süre, başlıkta kehribar renkli bir çipte gösterilir ve süre dolunca anket kapanır.',
  'help.guide.create-poll.tip.4':
    "“Anketler”in Eklentiler altında, İş birliği'nin altında kendi anahtarı vardır: yönetici bunu kapatıp diğer dört paneli açık tutabilir.",
  // vote-poll
  'help.guide.vote-poll.title': 'Oy verin ve sonucu okuyun',
  'help.guide.vote-poll.goal': 'Oy verin, grubun sonuçlarını görün ve oyunuzu değiştirin.',
  'help.guide.vote-poll.step.1':
    'İstediğiniz seçeneğe tıklayın. Dairesinde onay işareti belirir, seçenek vurgu renginde bir çerçeve alır ve arkasındaki çubuk uzar.',
  'help.guide.vote-poll.step.2':
    'Artık sonucun tamamını görebilirsiniz: çubuk payı, sağdaki yüzde oranı gösterir; küçük daireler o seçeneği seçen kişilerdir (en fazla üç tanesi).',
  'help.guide.vote-poll.step.3':
    'Fikrinizi mi değiştirdiniz? Başka bir seçeneğe tıklayın. “Çoklu seçim” olmayan bir ankette oyunuz ikinci bir oy eklemek yerine yeni seçeneğe geçer.',
  'help.guide.vote-poll.step.4':
    'Oy sayısı, sorunun altındaki bir çipte gösterilir. Zaten seçtiğiniz seçeneğe tıklamak oyunuzu geri alır ve sayı düşer.',
  'help.guide.vote-poll.result':
    'Seçtiğiniz seçenek işaretlenir, çubuklar grubun nasıl oy verdiğini, daireler ise kimin hangi seçeneği seçtiğini gösterir.',
  'help.guide.vote-poll.tip.1':
    'Yüzdeler ve kimin neye oy verdiği ancak siz oy verdikten sonra ya da anket kapandığında görünür. Başlıktaki oy sayısını herkes görür.',
  'help.guide.vote-poll.tip.2':
    'Oylar hiçbir zaman anonim değildir: bir seçenekteki dairelerden birinin üzerine gelerek oy veren kişinin adını görebilirsiniz.',
  // close-poll
  'help.guide.close-poll.title': 'Bir anketi kapatın ya da silin',
  'help.guide.close-poll.goal':
    'Grup karar verdikten sonra oylamayı durdurun, kimsenin artık ihtiyaç duymadığı bir anketi silin.',
  'help.guide.close-poll.step.1':
    'Anket başlığının sağındaki kilit simgeli “Kapat” oylamayı bitirir. Seçeneklere artık tıklanamaz.',
  'help.guide.close-poll.step.2':
    'Kapatılan anket panelin altına iner; üstte açık anketler varsa Kapalı başlığının altında yer alır. Üzerinde bir Kapalı etiketi bulunur ve oy kullanmış olsun olmasın herkese sonucu gösterir. Kazanan seçenek yeşil çubukta kalın yazılır. Seçtiğiniz seçenek kazandıysa çubuk bunun yerine vurgu renginizde görünür.',
  'help.guide.close-poll.step.3':
    'Başlığın sağındaki çöp kutusu olan “Sil” anketi siler. Kapatılmış bir ankette kilit olmadığı için tek düğme odur. Onay istenmez ve oylar da silinir.',
  'help.guide.close-poll.result':
    'Silinen anket her üyenin panelinden kaybolur. Yalnızca kapattığınız anket ise sonucuyla birlikte altta görünür kalır.',
  'help.guide.close-poll.tip.1':
    'Kapatma geri alınamaz, yeniden açma yoktur. Yanlışlıkla kapatılan bir anketi yeniden oluşturmanız gerekir.',
  'help.guide.close-poll.tip.2': '“Sil”, anketi ve tüm oyları herkes için hemen ve onay sormadan kaldırır.',
  // whats-next
  'help.guide.whats-next.title': '“What’s Next”i okuyun',
  'help.guide.whats-next.goal': 'Planı açmadan grubun sıradaki işini görün.',
  'help.guide.whats-next.step.1':
    'Kart, seyahatin yaklaşan duraklarını, en fazla sekiz tanesini, zaman sırasıyla ve her gün için bir başlık altında listeler: “Bugün”, “Yarın” ya da tarih, günün adı varsa yanında o adla. Kartın üst kısmı kaç durak olduğunu gösterir.',
  'help.guide.whats-next.step.2':
    'Her durağın solunda saati yer alır: başlangıç, “to” ve varsa bitiş saati, ya da henüz saat ayarlanmamışsa TBD.',
  'help.guide.whats-next.step.3':
    'Yanında ad, adres ve çip olarak o duraktaki kişiler yer alır. Durağa kimse atanmamışsa seyahatteki herkes listelenir.',
  'help.guide.whats-next.result':
    'Yaklaşanların yalnızca okunabilir bir listesi: plana göre oluşur ve buradan hiçbir şey planı değiştirmez.',
  'help.guide.whats-next.tip.1':
    'Burada hiçbir şey ayarlamazsınız. Saatler gün planından gelir; onları orada değiştirirseniz bu liste hemen güncellenir.',
  'help.guide.whats-next.tip.2':
    'Yalnızca henüz gelmemiş olanlar listelenir: başlangıç saati geçen durak listeden kalkar, bugünün saati olmayan bir durak gün bitene kadar kalır ve seyahatin sonunda panel boş olur.',
  'help.guide.whats-next.tip.3':
    '“What’s Next”in “Eklentiler” altında, “İş birliği”nin altında kendi anahtarı vardır. Masaüstü paneldir: telefon uygulamasının “İş birliği” sekmesinde görünmez.',
  // trip-chat
  'help.guide.trip-chat.title': 'Grupla konuşun',
  'help.guide.trip-chat.goal':
    'Mesaj gönderin, belirli bir mesajı yanıtlayın, başka bir mesaja tepki verin ve kendi mesajınızı silin.',
  'help.guide.trip-chat.step.1':
    "“Mesaj yazın...” alanına yazın ve Enter'a basın. Kutunun yanındaki yuvarlak ok da aynı işi yapar. Shift ve Enter ise yeni satır açar.",
  'help.guide.trip-chat.step.2':
    'Gülen yüz, içinde Smileys, Reactions ve Travel bulunan emoji seçiciyi açar. Seçtiğiniz emoji yazmakta olduğunuz metne eklenir, kendiliğinden gönderilmez.',
  'help.guide.trip-chat.step.3':
    'Başkasının mesajının üzerine gelin: köşesinde küçük yuvarlak bir düğme belirir. Bu, “Yanıtla” düğmesidir.',
  'help.guide.trip-chat.step.4':
    'Yanıtladığınız mesaj kutunun üstünde alıntılanır. Mesajınızı yazıp gönderin; alıntı da onunla birlikte gider. Alıntıyı kaldırmak için üzerindeki çarpıya tıklayın.',
  'help.guide.trip-chat.step.5':
    'Sekiz hızlı tepkiyi görmek için bir mesaja sağ tıklayın. Tepkiniz mesajın altında görünür. Kaldırmak için aynı tepkiye yeniden tıklayın.',
  'help.guide.trip-chat.step.6':
    'Kendi mesajlarınızda “Yanıtla”nın yanında “Sil” (çöp kutusu simgesi) de bulunur. Mesajı hemen siler ve mesajı sildiğinizi belirten bir not bırakır. Bunu geri alamazsınız.',
  'help.guide.trip-chat.result':
    'Yanıtınız en yeni mesajdır ve alıntılanan mesaj üstünde görünür. Tepkiniz diğer mesajın altında belirir. Sildiğiniz mesajın yerinde, sizin sildiğinizi belirten bir not görünür.',
  'help.guide.trip-chat.tip.1':
    'Enter gönderir, Shift ve Enter yeni satır açar. Yalnızca bir ila üç emojiden oluşan mesaj büyük gösterilir.',
  'help.guide.trip-chat.tip.2':
    '“Görsel ekle” ile bir mesaja en fazla dört resim ekleyebilirsiniz. Resimleri yapıştırabilir ya da kutunun üzerine bırakabilirsiniz.',
  'help.guide.trip-chat.tip.3':
    'Bağlantı içeren bir mesajın altında bir önizleme kartı görünür; kartı sizin kendi TREK’iniz getirir, bu yüzden yalnızca sizin erişebildiğiniz bir yere giden bağlantı düz bağlantı olarak kalır.',
  'help.guide.trip-chat.tip.4':
    '“Sohbet”in “Eklentiler” altında, “İş birliği”nin altında kendi anahtarı vardır: yönetici sohbeti kapatıp notları, bağlantıları, anketleri ve “What’s Next”i açık bırakabilir.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listeler',
  'help.ctx.trip-lists.summary':
    'Bir seyahat için iki liste: kimin neyi getireceğini ve ne kadar ağırlık yaptığını gösteren paketleme listesi ile seyahatten önce ve seyahat sırasında yapılması gereken her şeyin yapılacaklar listesi. Listeler eklentisi açıkken sekme görünür.',
  'help.ctx.trip-lists.bullet.1':
    'Üstteki çubukta “Paket Listesi” ve “Yapılacaklar” ikisi arasında geçiş yapmanızı sağlar ve her birinde kaç öğe olduğunu gösterir. Çubuğun sağ ucundaki düğmeler hangisi açıksa ona aittir.',
  'help.ctx.trip-lists.bullet.2':
    'Paket listesi, istediğiniz adı verebileceğiniz listelere ayrılır, örneğin Belgeler ya da Giysiler. Her liste bir karttır. Kartın başlığında şunlar bulunur: tüm listeyi başka bir konuma sürüklemek için bir tutamak, bir renk noktası, paketlenen/toplam rozeti, Yeniden adlandır, Tümünü İşaretle, Tüm işaretleri kaldır ve Listeyi sil seçeneklerini içeren üç nokta, bir de kartı daraltan bir ok. Yukarıdaki çubukta Liste ekle yeni bir liste oluşturur.',
  'help.ctx.trip-lists.bullet.3':
    'Bir satırda tutamak, onay kutusu ve ad bulunur; ardından öğeyi getirecek kişinin küçük avatarı gelir. Miktarı birden fazla olan öğede ayrıca eksi ve artı düğmeli, 3/10 gibi bir paketlendi sayacı bulunur. Sonra küçük bir rozet olarak miktar ve Çanta Takibi açıkken gram cinsinden ağırlık ile bir çanta halkası gelir; en sonda çöp kutusu ve Listeye taşı, Paylaşma, Yeniden adlandır ve Sil seçeneklerini içeren üç nokta menüsü yer alır. Satırın kullanmadığı denetimler, üzerine gelene kadar soluk kalır.',
  'help.ctx.trip-lists.bullet.4':
    "Paylaşılan ve Listem, paket listesini ikiye ayırır: herkesin gördüğü ortak liste ve sizin kendi listeniz. Yanlarındaki Tümü, Açık ve Bitti, hangisi açıksa onu daraltır. Satırın en ucundaki A'dan Z'ye her listenin öğelerini ad sırasına göre gösterir, ikinci tıklama kendi sıranıza geri döner. Üstteki ilerleme kartı paketlenenleri sayar.",
  'help.ctx.trip-lists.bullet.5':
    '“Şablon uygula” ve “Şablon olarak kaydet”, bir listeyi elle yazmadan doldurur ya da saklar. Onlardan sonraki iki simge, “Dışa aktar” ve “İçe aktar”, listeyi çıktı, PDF veya dosya olarak dışa aktarır ve bir listeyi içe aktarır. İlerleme kartının sağ ucundaki kırmızı düğme kaç öğenin işaretli olduğunu gösterir ve onları kaldırır.',
  'help.ctx.trip-lists.bullet.6':
    '“Yapılacaklar”ın kendi kenar çubuğu vardır: ilerleme kartı, “Tümü”, “Görevlerim”, “Gecikmiş” ve “Bitti” filtreleri, liste başına bir satır ve bunların altında “Liste ekle”. Görevler bir kartın içindedir. Kartın başlığında filtrenin adı ve sıralama düzeni, yani “Öncelik” ya da “Son tarih”, görünür. Bir göreve tıklamak onu sağdaki bölmede açar. Çubuktaki “Yeni görev ekle” “Yeni görev” iletişim kutusunu açar.',
  // packing-categories
  'help.guide.packing-categories.title': 'Paket listesini hazırlayın',
  'help.guide.packing-categories.goal':
    'Götüreceklerinizi listelere ayırın, listelere öğe ekleyin ve her listeden kimin sorumlu olduğunu seçin.',
  'help.guide.packing-categories.step.1':
    'Listelerin üstündeki çubukta “Liste ekle” düğmesine tıklayın. Küçük bir pencere açılır. Adı üstteki bandda “Liste adı (ör. Giysi)” yazan yere yazın ve “Ekle” düğmesine tıklayın.',
  'help.guide.packing-categories.step.2':
    "Yeni liste, yalnızca üç soluk nokta gösteren bir yer tutucu satırla başlar. Satırın altındaki “Kalem ekle”ye tıklayın, öğeyi “Öğe adı...” alanına yazın ve Enter'a basın: ilk öğe yer tutucunun yerini alır ve alan bir sonraki öğe için açık kalır.",
  'help.guide.packing-categories.step.3':
    'Bir satırı adına tıklayarak ya da sağ ucundaki üç noktadan “Yeniden adlandır”ı seçerek yeniden adlandırın.',
  'help.guide.packing-categories.step.4':
    'Listenin üst şeridindeki, içinde kişi simgesi olan kesik çizgili daire, seyahat üyelerini listeye atar. Bir ad seçin. O kişiyi yeniden çıkarmak için beliren etikete tıklayın.',
  'help.guide.packing-categories.step.5':
    'Sayının yanındaki üç nokta daha fazla seçenek açar: “Yeniden adlandır”, “Tümünü İşaretle”, “Tüm işaretleri kaldır” ve “Listeyi sil”. “Listeyi sil” listeyi ve tüm öğelerini bir daha sormadan siler. En sağdaki ok listeyi daraltır.',
  'help.guide.packing-categories.result':
    'Yeni liste ızgarada, altında öğeleri ve renkli noktasıyla görünür; rozeti şimdiden paketlenenleri sayar.',
  'help.guide.packing-categories.tip.1':
    'Bir liste yalnızca öğeleri sayesinde vardır. Son öğeyi silerseniz satır bir yer tutucuya dönüşür, böylece liste yerini ve rengini korur. O satırı da silerseniz liste silinir.',
  'help.guide.packing-categories.tip.2':
    'Bir listeye birini atadığınızda o kişiye paketleme bildirimi gider. Bu, öğeleri kimin görebileceğini değiştirmez. Onu bir satırın üç nokta menüsündeki “Paylaşma” belirler.',
  'help.guide.packing-categories.tip.3':
    'İki liste aynı adı taşıyabilir. TREK bunları dahili olarak ayrı tutar, bu yüzden adlar yazdığınız gibi kalır.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Eşyaları toplarken işaretleyin',
  'help.guide.check-off-packing.goal':
    'Çantadakileri işaretleyin, ilerleme çubuğunu izleyin ve toplanan öğeleri kaldırın.',
  'help.guide.check-off-packing.step.1':
    'Satırın solundaki kutuya tıklayın. Adın üstü çizilir ve ilerleme çubuğu güncellenir.',
  'help.guide.check-off-packing.step.2':
    'Listelerin üstündeki ilerleme kartı, listedeki tüm öğelerden kaçının paketlendiğini sayı, yüzde ve çubuk olarak gösterir.',
  'help.guide.check-off-packing.step.3':
    'Bir listenin tamamını birden işaretlemek için başlığındaki üç noktada “Tümünü İşaretle” ve “Tüm işaretleri kaldır” seçenekleri vardır.',
  'help.guide.check-off-packing.step.4':
    '“Paylaşılan” ve “Listem” yanındaki “Tümü”, “Açık” ve “Bitti” ızgarayı filtreler. “Açık” yalnızca hâlâ eksik olanları gösterir, bu yüzden tamamen hazırlanmış bir liste gizlenir.',
  'help.guide.check-off-packing.step.5':
    'İlerleme kartının sağ ucundaki, içinde işaretli öğe sayısı yazan kırmızı Remove … checked düğmesi, tarayıcının tek bir onayından sonra işaretli öğelerin hepsini birden siler.',
  'help.guide.check-off-packing.result':
    'Yalnızca açık öğeler listelenir ve üstteki çubuk paketlemenin ne kadarının tamamlandığını gösterir.',
  'help.guide.check-off-packing.tip.1': 'İşaretli bir öğeyi yine de yeniden adlandırabilirsiniz: adına tıklayın.',
  'help.guide.check-off-packing.tip.2':
    '“Tümünü İşaretle” ve “Tüm işaretleri kaldır” her seferinde tek bir listede, o listenin kendi üç noktası menüsünden çalışır.',
  'help.guide.check-off-packing.tip.3':
    'Tüm öğeler işaretlendiğinde sayacın yerini “Hepsi paketlendi!” alır ve çubuk yeşile döner.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Paket şablonu uygulayın',
  'help.guide.apply-packing-template.goal':
    'Seyahate hazır bir liste ekleyin ve bu seyahatin listesini bir sonraki seyahat için kaydedin.',
  'help.guide.apply-packing-template.step.1': 'Listenin üstündeki çubukta “Şablon uygula” düğmesine tıklayın.',
  'help.guide.apply-packing-template.step.2': 'Bir şablon seçin. Her satırda şablonun adı ve kaç öğe içerdiği yazar.',
  'help.guide.apply-packing-template.step.3':
    'Öğeler bulunduğunuz görünüme eklenir: “Paylaşılan” onları herkesin gördüğü ortak listeye, “Listem” kendi listenize ekler.',
  'help.guide.apply-packing-template.step.4':
    'Bu seyahatin listesini sonraki seyahat için saklamak üzere “Şablon olarak kaydet”e tıklayın. Küçük bir pencere açılır. Üstteki “Şablon adı” yazan alana bir ad yazın ve “Kaydet”e tıklayın.',
  'help.guide.apply-packing-template.result':
    'Şablonun listeleri ve öğeleri, zaten orada olanların yanında seyahate eklenir.',
  'help.guide.apply-packing-template.tip.1':
    'Şablon her öğenin listesini, miktarını, ağırlığını ve çantasını getirir; seyahatte henüz olmayan bir çantayı da oluşturur. İşaretler kopyalanmaz ve listede zaten olan hiçbir şey kaldırılmaz.',
  'help.guide.apply-packing-template.tip.2':
    '“Şablon uygula” yalnızca bir şablon varsa görünür. Şablon yoksa düğme hiç görünmez.',
  'help.guide.apply-packing-template.tip.3':
    '“Şablon olarak kaydet” yalnızca örnek yöneticisine ve yalnızca listede öğe varken görünür. Ortak öğeleri ve sizin öğelerinizi kaydeder, başka bir üyenin özel öğelerini asla kaydetmez.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Bütün bir paketleme listesini yapıştırın',
  'help.guide.import-packing-list.goal':
    'Başka bir yerde zaten var olan bir listeyi tek seferde paketleme öğelerine dönüştürün.',
  'help.guide.import-packing-list.step.1':
    '“İçe aktar”a tıklayın; listenin üstündeki çubuğun sağ ucunda, aşağı oklu simgedir.',
  'help.guide.import-packing-list.step.2':
    'Satır başına bir öğe: Kategori, Ad, gram cinsinden ağırlık (isteğe bağlı), Çanta (isteğe bağlı), checked/unchecked (isteğe bağlı). Kutudaki gri örnek dört biçimi de gösterir; sol kenardaki numaralar yazdığınız satırları sayar. Markdown listesi de olur: başlık listeye adını verir, "- [ ]" ve "- [x]" ise öğeye dönüşür.',
  'help.guide.import-packing-list.step.3':
    'Ya da satırları, iletişim kutusunun sol altındaki “CSV/TXT/MD Yükle” ile bir dosyadan yükleyin. Bir .csv, .txt ya da .md dosyası alır ve kutuda ne varsa onun yerine geçer.',
  'help.guide.import-packing-list.step.4':
    'Sağ alttaki “İçe aktar 3”e tıklayın; üzerindeki sayı TREK’in anladığı satırları sayar.',
  'help.guide.import-packing-list.result':
    'Her satır, ilk alanında adı geçen listeye bir öğe olarak eklenir. Zaten var olan öğeler değişmez.',
  'help.guide.import-packing-list.tip.1':
    'Alanları virgül, noktalı virgül ve sekme ayırır; çift tırnak bir alanı bir arada tutar, bu yüzden “Gömlek, mavi” tek bir ad olarak kalır. Tek değerli bir satır yalnızca addır. Kendi listesi olmayan bir satır “Diğer” listesine girer. Adın önündeki “3x” adedi belirler.',
  'help.guide.import-packing-list.tip.2':
    'Dördüncü alanda adı geçen çanta seyahatte henüz yoksa TREK onu oluşturur. İçe aktar ve Şablon uygula, birçok öğenin ağırlığını ve çantasını tek seferde eklemenin iki yoludur.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Paketleme listesini yazdırın veya dışa aktarın',
  'help.guide.export-packing-list.goal':
    'Listeyi yazdırın, PDF olarak kaydedin ya da başka bir uygulama veya sonraki seyahat için dosya olarak dışa aktarın.',
  'help.guide.export-packing-list.step.1':
    '“Dışa aktar”a tıklayın; listenin üstündeki çubukta, “İçe aktar”ın hemen önündeki yukarı oklu simgedir.',
  'help.guide.export-packing-list.step.2':
    '“Markdown kontrol listesi (.md)” ve “İçe aktarma için CSV (.csv)” listeyi hemen dosya olarak kaydeder.',
  'help.guide.export-packing-list.step.3':
    '“Yazdır veya PDF olarak kaydet”e tıklayın. Önizleme listeyi bir sayfa olarak gösterir: üstte seyahat, tarihleri ve ne kadarının paketlendiği, ardından her liste bir kart olarak, her öğe işaretlenecek bir kutuyla.',
  'help.guide.export-packing-list.step.4':
    'Önizlemenin altındaki “Yazdır veya PDF olarak kaydet” düğmesine tıklayın. Tarayıcı yazdırma penceresini açar: bir yazıcı seçin ya da dosya olarak kaydetmek için “PDF olarak Kaydet” seçeneğini seçin.',
  'help.guide.export-packing-list.result':
    'Çıktı ve dosyalar, açık olan görünümü (“Paylaşılan” ya da “Listem”) adetler, ağırlıklar ve onay işaretleriyle birlikte içerir.',
  'help.guide.export-packing-list.tip.1':
    'CSV, “İçe aktar”ın okuduğu biçimdir ve çantaları da içerir, bu yüzden kendi paketleme şablonunuz olarak kullanabilirsiniz: onu sonraki seyahate içe aktarın.',
  'help.guide.export-packing-list.tip.2':
    'Markdown dosyası Obsidian, Notion veya GitHub’da kontrol listesi olarak açılır ve “İçe aktar” ile geri alabilirsiniz.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Bir öğeyi kimin göreceğine ve kimin getireceğine karar verin',
  'help.guide.share-packing-item.goal':
    'Bir öğeyi grup havuzu, kendi listeniz ve onu getirdiğiniz kişiler arasında taşıyın.',
  'help.guide.share-packing-item.step.1':
    'Listelerin üstünde “Paylaşılan” herkesin gördüğü listedir, “Listem” ise sizin kendi listenizdir. İkisi de kaç öğe içerdiğini gösterir. Kendi listenizi görmek için “Listem”e tıklayın.',
  'help.guide.share-packing-item.step.2':
    '“Paylaşılan” sekmesine dönün, bir satırın sonundaki üç noktayı açın ve “Paylaşma” seçeneğine tıklayın.',
  'help.guide.share-packing-item.step.3':
    'Üç seviye vardır: “Paylaşılan”, gruptaki herkese görünür; “Kişisel”, yalnızca sizin görebildiğiniz; ve “Şu kişilerle paylaş…”, öğenin kimler için olduğunu seçtiğiniz.',
  'help.guide.share-packing-item.step.4':
    '“Kişisel” bir öğe yalnızca “Listem” içindedir. Onu bulmak için “Listem”e geçin.',
  'help.guide.share-packing-item.step.5':
    '“Paylaşma”yı yeniden açın ve “Şu kişilerle paylaş…” altından bir ad işaretleyin. Öğe o kişinin listesinde de görünür ve satırda, öğenin kaç kişiyle paylaşıldığını gösteren küçük bir rozet belirir.',
  'help.guide.share-packing-item.result': 'Öğe seçtiğiniz düzeyde yer alır ve satırda onu kimin getirdiği görünür.',
  'help.guide.share-packing-item.tip.1':
    'Bir öğenin paylaşımını yalnızca öğeyi getiren kişi değiştirebilir. Öğeyi paylaştığınız kişi onu kendi “Listem” görünümünde, üzerine gelince adınızı gösteren küçük bir el rozetiyle görür. Öğeyi işaretleyebilir.',
  'help.guide.share-packing-item.tip.2':
    'Başkasının getirdiği paylaşılan bir öğede üç nokta menüsü “Paylaşma” yerine iki başka seçenek gösterir: sizi onun yanına ekleyen “Ben de getirebilirim” ve size özel bir kopya oluşturan “Listeme kopyala”.',
  'help.guide.share-packing-item.tip.3':
    "Yeni öğeler paylaşım ayarını eklendikleri görünümden alır. Paylaşılan'da eklenen öğeler herkesle paylaşılır. Listem'de eklenen öğeler Kişisel olur; yalnızca o listenin tüm öğeleri aynı kişilerle paylaşılıyorsa yeni öğe de onlarla paylaşılır.",
  // packing-bags
  'help.guide.packing-bags.title': 'Çantaları tartın',
  'help.guide.packing-bags.goal':
    'Her öğeye ağırlık ekleyin, öğeleri çantalara ayırın ve her çantayı havayolunun sınırının altında tutun.',
  'help.guide.packing-bags.step.1':
    'Dairenin önündeki ağırlık rozetine tıklayın ve öğenin ağırlığını gram olarak yazın.',
  'help.guide.packing-bags.step.2': 'Ağırlığın yanındaki daire öğenin çantasıdır. Tıklayın.',
  'help.guide.packing-bags.step.3':
    'Henüz çanta yoksa “Çanta ekle”ye tıklayın, bir ad yazın ve Enter’a basın. Çanta oluşturulur ve öğe doğrudan içine konur.',
  'help.guide.packing-bags.step.4':
    'Bir çanta oluşturur oluşturmaz Çantalar kartı listelerin sağında belirir. Her çantada adı, kimin taşıdığı, bir doluluk çubuğu, içindeki öğe sayısı ve ağırlığı görünür. Çantaların altında Atanmamış ve Toplam ağırlık, onun altında da Paketlendi yer alır: zaten paketlenen ağırlık ve payını gösteren ince bir çubuk.',
  'help.guide.packing-bags.step.5':
    'Çantanın ağırlığının yanındaki “Limit belirle”ye tıklayın ve limiti havayollarının belirttiği gibi kilogram cinsinden yazın.',
  'help.guide.packing-bags.step.6':
    "Çanta adı satırının sonunda, çarpıdan hemen önceki kesikli artı Üye ata'yı açar. Çantayı taşıyan üyeleri işaretleyin: artının yanında görünürler. Kartın altındaki Kişi başı her birinin ne taşıdığını listeler.",
  'help.guide.packing-bags.result':
    'Sağdaki “Çantalar” kartı her çantanın ağırlığını sınırıyla karşılaştırmalı gösterir; hiçbir çantada olmayanları, kişi başına taşınanları ve toplamı, ne kadarının paketlendiğiyle birlikte listeler.',
  'help.guide.packing-bags.tip.1':
    'Ağırlık alanı, çanta dairesi ve “Çantalar” kartı yalnızca yönetici “Listeler” eklentisi altında “Çanta Takibi”ni açtıysa bulunur. Dar bir pencerede çantalar bunun yerine ilerleme kartının üstündeki “Çantalar” düğmesinden açılır.',
  'help.guide.packing-bags.tip.2':
    'Sunucu, bir çantanın ağırlığını görmediğiniz öğeler de dahil olmak üzere tüm üyelerin öğelerinden hesaplar, bu yüzden gördüğünüz sayı çantanın gerçek ağırlığıdır.',
  'help.guide.packing-bags.tip.3':
    'Sınırı olmayan bir çanta en ağır çantayla karşılaştırılır, böylece çubukları kıyaslayabilirsiniz. Çantaya bir sınır verirseniz çubuk bunun yerine o sınıra göre ölçülür.',
  // create-todo
  'help.guide.create-todo.title': 'Görev ekleyin',
  'help.guide.create-todo.goal': 'Bir görev yazın; liste, öncelik, tarih ve atanan kişiyi de belirleyin.',
  'help.guide.create-todo.step.1': 'Çubuğun sağ ucundaki “Yeni görev ekle”ye tıklayın.',
  'help.guide.create-todo.step.2':
    '“Yeni görev” iletişim kutusu imleç başlıkta olacak şekilde açılır. Adı “Görev adı” alanına yazın, hatırlamak istediğiniz diğer her şeyi “Açıklama” altına ekleyin.',
  'help.guide.create-todo.step.3':
    '“Liste” görevi gruplar. Birini seçin ya da yanındaki artı ile küçük bir pencerede yeni bir liste adlandırın.',
  'help.guide.create-todo.step.4': '“Öncelik” dört düğmeden oluşur: “Yok”, P1, P2 ve P3, kırmızıdan maviye.',
  'help.guide.create-todo.step.5': '“Liste”nin yanındaki “Son tarih” takvimi açar, “Atanan” görevi bir kişiye atar.',
  'help.guide.create-todo.step.6': '“Görev oluştur”a tıklayın.',
  'help.guide.create-todo.result':
    'Görev listede görünür; öncelik, son tarih ve liste rozet olarak, atanan kişinin avatarı da satırın sonunda yer alır. Görev sağdaki bölmede açılır.',
  'help.guide.create-todo.tip.1':
    'Yalnızca ad zorunludur. Geri kalan her şeyi sonradan sağdaki bölmeden doldurabilirsiniz.',
  'help.guide.create-todo.tip.2': 'Kenar çubuğunda bir liste seçiliyken yeni görev o listede başlar.',
  'help.guide.create-todo.tip.3': 'Ad alanında Enter, diğer alanlara dokunmadan görevi hemen oluşturur.',
  // todo-filters
  'help.guide.todo-filters.title': 'Bir görevi bulun ve değiştirin',
  'help.guide.todo-filters.goal': 'Yalnızca şimdi önemli olan görevleri gösterin, sonra bulduğunuz görevi düzenleyin.',
  'help.guide.todo-filters.step.1':
    'Kenar çubuğundaki “Görevler” bölümünde: “Tümü” hâlâ açık olan her şeyi, “Görevlerim” size atananları, “Gecikmiş” tarihi geçmiş görevleri, “Bitti” ise tamamlanan görevleri gösterir. Her birinin yanında sayısı yazar. “Gecikmiş”e tıklayın.',
  'help.guide.todo-filters.step.2':
    '“Listeler” altında her liste için bir satır vardır. Birini seçerseniz tamamlanan görevler dahil o listeyi görürsünüz.',
  'help.guide.todo-filters.step.3':
    'Listenin üstündeki sıralama, ekrandakilerin sırasını değiştirir: “Öncelik” P1 olanları öne alır, “Son tarih” en yakın son tarihi öne alır. Aynı anda yalnızca biri kullanılabilir; ikinci bir tıklama kendi sıranıza geri döndürür.',
  'help.guide.todo-filters.step.4': 'Sağdaki bölmede açmak için bir göreve tıklayın.',
  'help.guide.todo-filters.step.5':
    'Değiştirmek istediklerini düzenle: ad, “Öncelik”, “Liste”, “Son tarih” veya “Atanan”. “Açıklama” metnini çalışan bağlantılarla gösterir; düzenlemek için içine tıkla. Sonra panelin altındaki “Değişiklikleri kaydet”e tıkla. Panel başlığındaki kutu görevi tamamlandı olarak işaretler, “Değişiklikleri kaydet”in yanındaki “Sil” ise görevi hemen siler.',
  'help.guide.todo-filters.result':
    'Liste yalnızca istediğiniz görevleri gösterir; sağdaki bölme seçtiğiniz görevi düzenler.',
  'help.guide.todo-filters.tip.1':
    'Liste satırı yalnızca açık görevleri sayar, ama satırı seçtiğinizde biten görevler de gösterilir. “Tümü”, “Görevlerim” ve “Gecikmiş” biten görevleri gizler, “Bitti” ise yalnızca biten görevleri gösterir.',
  'help.guide.todo-filters.tip.2':
    'Sıralamada “Öncelik” ve “Son tarih” birlikte kullanılamaz. İkisinden biri açıkken satırları kendi istediğiniz sıraya sürükleyemezsiniz.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervasyonlar',
  'help.ctx.trip-bookings.summary':
    'Bu sekmede seyahat için ayrılan her şey var; ulaşım hariç: konaklamalar, masalar, biletler, turlar ve otopark. Her rezervasyon bir kart, bir liste satırı ya da zaman çizelgesinde bir çubuktur; kodu, belgeleri, yolcuları ve maliyeti de içerir. Ayrıntıları açmak için bir rezervasyona tıklayın.',
  'help.ctx.trip-bookings.bullet.1':
    'Çubuğun sağ ucundaki “Manuel Rezervasyon”, “Yeni Rezervasyon” formunu açar. Altı tür rezervasyon oluşturur: Konaklama, Restoran, Etkinlik, Tur, Otopark ve Diğer. Uçuşlar, trenler ve diğer ulaşım “Ulaşım” sekmesindedir ve burada hiç görünmez.',
  'help.ctx.trip-bookings.bullet.2':
    "Manuel Rezervasyon'un önündeki indirme simgesi (Rezervasyon onaylarını içe aktar), TREK'in otomatik okuyabilmesi için onayları yükler: EML, PDF, PKPass, HTML ya da TXT; en fazla 10 MB'lık beş dosya, yapay zeka modeli resim okuyabiliyorsa fotoğraflar da. Simge yalnızca sunucu bunları okuyabiliyorsa görünür.",
  'help.ctx.trip-bookings.bullet.3':
    '“Ara” başlıklarda, türlerde, yerlerde, notlarda, rezervasyon kodlarında ve yolcularda arar. Yanındaki huni olan “Filtrele”, sekmeyi “Durum”a, her biri için sayı gösteren “Tür”e ve bir rezervasyonda kişi adı varsa “Yolcular”a göre daraltır. Huni üzerindeki sayı kaç filtrenin açık olduğunu gösterir.',
  'help.ctx.trip-bookings.bullet.4':
    "Filtrele'den sonraki üç simge görünümü değiştirir: Kartlar, Liste ve Zaman çizelgesi. Yanlarındaki kaydırıcı simgesi olan Görünüm seçenekleri, kartları ve listeyi gruplar ve sıralar ya da zaman çizelgesinin şeritlerini ayarlar. Ardından gelen tablo simgesi (Tablo olarak dışa aktar (CSV)), sekmenin gösterdiklerini dosya olarak indirir. Kartlar varsayılan olarak Onaylandı ve Beklemede, liste ise güne göre gruplanır. Bir bölümü daraltmak için başlığına tıklayın.",
  'help.ctx.trip-bookings.bullet.5':
    'Kartın üstünde durumuna göre renklenen bir başlık şeridi bulunur: durum noktası (tıklamak “Beklemede” ile “Onaylandı” arasında geçiş yapar), tür, başlık, kalem ve çöp kutusu. Altında rezervasyonun sahip olduğu ayrıntılar yer alır: Tarih, Zaman, Rezervasyon Kodu, Giriş ve Çıkış, Konum / Adres, Konaklama, Bağlı olduğu (plandaki durak), Bağlantı, Notlar, Yolcular, Dosya ve bağlı maliyetler.',
  'help.ctx.trip-bookings.bullet.6':
    'Bir karta, satıra ya da çubuğa tıklamak rezervasyonun ayrıntısını açar. Altta Haritada (rezervasyonun bir yeri varsa), çöp kutusu ve Düzenle bulunur. Silme bir kez sorar (Rezervasyon silinsin mi?; maliyetler de silinecekse bunu belirtir). Sonra rezervasyon bağlı harcamalarıyla birlikte silinir, konaklamada ise geceleri gün planından kaldırılır.',
  // booking-views
  'help.guide.booking-views.title': 'Görünümü değiştirin ve bir rezervasyonu açın',
  'help.guide.booking-views.goal':
    'Rezervasyonları kart, liste ya da zaman çizelgesi olarak görün ve tüm ayrıntılarını görmek için birini açın.',
  'help.guide.booking-views.step.1':
    'Çubukta “Filtrele”den sonraki üç simge görünümlerdir; üzerine gelince her biri adını gösterir: “Kartlar”, “Liste” ve “Zaman çizelgesi”. Sekme “Kartlar” görünümünde açılır; “Onaylandı” ve “Beklemede” bölümlerinde her rezervasyon için bir kart vardır. Ortadaki “Liste”ye tıklayın.',
  'help.guide.booking-views.step.2':
    '“Liste”, her rezervasyonu günlere göre başlıkların altına birer satır olarak koyar; gün ve saat sağda yer alır, ok tuşları satırdan satıra geçer. Üçünün sonuncusu olan “Zaman çizelgesi”ne tıklayın.',
  'help.guide.booking-views.step.3':
    '“Zaman çizelgesi” rezervasyonları seyahatin günlerine yayar: her tür için bir şerit ve her başlangıçtan bitişe uzanan bir çubuk vardır. Bekleyen rezervasyonun çerçevesi kesik çizgilidir. “Seyahat” tüm seyahati genişliğe sığdırır; bir günü saat saat görmek için günün başlığına tıklayın.',
  'help.guide.booking-views.step.4':
    '“Gün” görünümü tek bir günü saat ölçeğinde gösterir; her çubuğun uzunluğu süresini belirtir. Günün adının yanındaki oklar önceki ve sonraki güne geçer. Seyahat sürerken “Bugün” güncel güne atlar, sağdaki “Seyahat” ve “Gün” anahtarı da tüm seyahate geri döner.',
  'help.guide.booking-views.step.5':
    'Gününü, saatlerini ve yerini görmek için bir çubuğun üzerine gelin, sonra rezervasyonun ayrıntılarını açmak için çubuğa tıklayın. “Kartlar”daki bir kart ve “Liste”deki bir satır aynı açılır pencereyi açar.',
  'help.guide.booking-views.step.6':
    'Ayrıntı görünümünün başlığında başlık ile durum (tıklamak durumu değiştirir), tür, gün ve rezervasyon kodu için rozetler bulunur, kodu kopyalayan bir düğmeyle birlikte. Altında saatler kutucuklar halinde, sonra rezervasyonda varsa yer, yolcular, notlar, maliyetler ve dosyalar gelir. En altta “Haritada”, çöp kutusu ve “Düzenle” yer alır.',
  'help.guide.booking-views.result':
    'Rezervasyon ayrıntı görünümünde açılır: “Düzenle” formunu açar, “Haritada” rezervasyonu planda gösterir, “Kapat” ya da Escape sizi geldiğiniz görünüme geri götürür.',
  'help.guide.booking-views.tip.1':
    'Görünüm simgelerinden sonraki kaydırıcı simgeli “Görünüm seçenekleri”, “Gruplandır” ve “Sırala” ile “Kartlar” ve “Liste” görünümlerini gruplamanızı ve sıralamanızı sağlar. “Zaman çizelgesi”nde “Her tür için ayrı şerit” ve “Diğer sekmeyi de göster” seçeneklerini sunar. “Diğer sekmeyi de göster”, “Ulaşım” sekmesinin kayıtlarını soluk olarak, en üstte ince bir şeritte gösterir. “Görünümü sıfırla” varsayılanlara döner ve her sekme görünümünü bu tarayıcıda hatırlar.',
  'help.guide.booking-views.tip.2':
    'Seyahatten önceki ya da sonraki ya da tarihsiz bir rezervasyon zaman çizelgesinde görünemez. Grafiğin altında “Geziden önce”, “Geziden sonra” ya da “Tarih yok” başlığı altında küçük bir kart olarak gösterilir.',
  'help.guide.booking-views.tip.3':
    'Bir rezervasyon nerede görünürse görünsün aynı ayrıntılar açılır: “Ulaşım” sekmesinde, gün planında, bir günün ayrıntılarında ve bir yerin ayrıntılarında. Başlığına tıklamak rezervasyonu yeniden adlandırır.',
  // create-booking
  'help.guide.create-booking.title': 'Rezervasyon oluşturun',
  'help.guide.create-booking.goal':
    'Bir restoranı, etkinliği, turu, otopark yerini ya da başka bir şeyi seyahate elle ekleyin.',
  'help.guide.create-booking.step.1':
    'Çubuğun sağ ucundaki “Manuel Rezervasyon” düğmesine tıklayın. “Yeni Rezervasyon” açılır, üstteki başlıkta başlık alanı ve iki rozet bulunur.',
  'help.guide.create-booking.step.2':
    'Üstteki bandda, yeni rezervasyonda “Diğer” yazan tür etiketine tıklayın ve “Rezervasyon Türü”nü seçin. Bu sekme altı tür oluşturur: Konaklama, Restoran, Etkinlik, Tur, Otopark ve Diğer. Form seçiminize göre değişir: yalnızca Konaklama, tarihler yerine bir gün aralığı kullanır.',
  'help.guide.create-booking.step.3':
    'Başlığı üstteki banda, rozetlerin üzerindeki alana yazın. Zorunlu tek alan budur ve bir şey yazana kadar “Ekle” gri kalır.',
  'help.guide.create-booking.step.4':
    '“Tarih” ve “Başlangıç zamanı”nı, rezervasyonun bir bitişi varsa “Bitiş tarihi” ve “Bitiş zamanı”nı ayarla. Takvimlerde yalnızca seyahatin içindeki günler seçilebilir. Başlangıçtan sonra olmayan bir bitiş tarihi ve saati kırmızı görünür ve “Ekle”yi engeller. Bitiş tarihi olmayan, başlangıç saatinden önceki bir bitiş saati yalnızca uyarı verir: rezervasyon ertesi gün bitiyorsa bir bitiş tarihi belirle.',
  'help.guide.create-booking.step.5':
    'Onaydaki “Rezervasyon Kodu”nu girin, sonra başlıkta türün yanındaki durum rozetine tıklayın. Yeni rezervasyonda “Beklemede” yazar, tıklayınca “Onaylandı” olur. Kartın hangi bölümde görüneceğini bu durum belirler.',
  'help.guide.create-booking.step.6': 'Formun en altındaki “Ekle”ye tıklayın.',
  'help.guide.create-booking.result':
    'Rezervasyon kendi bölümünde bir kart olarak görünür. Başlığının rengi durumunu gösterir; kartta türü, tarihi, saatleri ve kodu yer alır. Seyahatteki diğer herkes onu hemen görür.',
  'help.guide.create-booking.tip.1':
    '“Konum / Adres” siz yazarken gerçek adresler önerir. Birini seçmek yazdığınızın yerini alır; kendi yazdığınız adres ise olduğu gibi kalır.',
  'help.guide.create-booking.tip.2':
    '“Bağlantı” alanına rezervasyonun sağlayıcıdaki kendi sayfasının adresini girin. Kart ve ayrıntı görünümü bunu yeni sekmede açılan bir bağlantı olarak gösterir.',
  'help.guide.create-booking.tip.3':
    'Notlar Markdown kullanır, bu yüzden bir liste ya da kalın bir satır, kartta ve ayrıntı görünümünde liste ya da kalın yazı olarak görünür.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Bir konaklama yeri ayırtın',
  'help.guide.booking-hotel.goal':
    'Bir konaklamayı girin; hem rezervasyon hem de gün planında geceler olarak aynı anda sayılsın.',
  'help.guide.booking-hotel.step.1':
    '“Manuel Rezervasyon”a tıklayın ve üst şeritteki tür rozetinden “Konaklama”yı seçin. Tarih alanlarının yerini bir otel alanları bloğu alır.',
  'help.guide.booking-hotel.step.2':
    'Konaklama altında oteli seçin. Liste, içe aktarılan izler ve turlar hariç seyahatin yerlerini içerir. Birini seçtiğinizde adı boş bir başlığa, adresi Konum / Adres alanına yazılır.',
  'help.guide.booking-hotel.step.3':
    'İlk gece ve ayrıldığınız sabah için “Başlangıç” ve “Bitiş” alanlarını ayarlayın. İkisi de seyahatin günlerini tarihleriyle sunar; TREK “Bitiş”in her zaman “Başlangıç”tan sonra olmasını sağlar.',
  'help.guide.booking-hotel.step.4':
    '“Giriş”, “Giriş tarihi şu tarihe kadar:” ve “Çıkış” alanlarını ve onaydaki “Rezervasyon Kodu”nu doldurun.',
  'help.guide.booking-hotel.step.5': '“Ekle” düğmesine tıklayın.',
  'help.guide.booking-hotel.result':
    'Kart, gün aralığını “Tarih” altında, giriş ve çıkış saatlerini ve adresi gösterir. Konaklama artık planın o günlerinde de görünür.',
  'help.guide.booking-hotel.tip.1':
    'Konaklama, “Tarih” ve “Başlangıç zamanı” olmayan tek türdür. Tarihleri “Gönderen” ve “Alıcı” alanlarıdır ve takvim tarihlerini değil, seyahatin günlerini seçersiniz.',
  'help.guide.booking-hotel.tip.2':
    '“Konaklama” alanını boş bırakıp adresi yazın: yer sizin için aranır, oluşturulur ve haritaya iğnelenir.',
  'help.guide.booking-hotel.tip.3': 'Rezervasyonu silerseniz geceleri de gün planından kaldırılır.',
  // link-booking
  'help.guide.link-booking.title': 'Rezervasyonu plana bağlayın',
  'help.guide.link-booking.goal':
    'Bir rezervasyonu durağına ve yerine bağlayın; böylece ihtiyacınız olan yerde görünür.',
  'help.guide.link-booking.step.1':
    'Bağlamak istediğiniz kartın üzerine gelin ve başlığındaki kaleme tıklayın. “Rezervasyonu Düzenle” açılır.',
  'help.guide.link-booking.step.2':
    '“Gün atamasına bağla” bölümünü açın. Liste planınızı gösterir: her gün için bir başlık, altında o günün numaralanmış ve saatli durakları. Rezervasyonun ait olduğu durağı seçin.',
  'help.guide.link-booking.step.3':
    '“Yer / Etkinlik” yerin kendisini bağlar. Yeri orada seçin, başlık ve “Konum / Adres” boşsa otomatik doldurulur.',
  'help.guide.link-booking.step.4': '“Güncelle”ye tıklayın.',
  'help.guide.link-booking.result':
    'Kartta “Bağlı olduğu” altında gün ve durak görünür; rezervasyon da gün planında o durakla birlikte yer alır.',
  'help.guide.link-booking.tip.1':
    'Listenin en üstündeki “Bağlantı yok (bağımsız)” bağlantıyı yeniden kaldırır. Konaklamada durak seçici yoktur: geceleri üzerinden bağlanır.',
  'help.guide.link-booking.tip.2':
    'Tarihli bir günde durak seçmek boş bir “Tarih” alanını sizin için doldurur. Zaten belirlediğiniz tarih değişmez.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Rezervasyonun kimin için olduğunu belirtin',
  'help.guide.booking-travelers.goal':
    'Bir rezervasyonun hangi yolcular için olduğunu işaretleyin, sonra yalnızca onların rezervasyonlarını görün.',
  'help.guide.booking-travelers.step.1':
    'Rezervasyonu kartındaki kalemle açın. “Yolcular”, “Rezervasyon Kodu”nun yanındadır. Rezervasyona kimse atanmamışken “Yolcu ata” yazar.',
  'help.guide.booking-travelers.step.2':
    'Tıklayın ve bu rezervasyonun kimler için olduğunu seçin; adı girilmiş misafirler de listede yer alır. Seçilen kişinin yanında onay işareti çıkar ve avatarı alanda görünür. Kaldırmak için adına yeniden tıklayın.',
  'help.guide.booking-travelers.step.3': '“Güncelle”ye tıklayın.',
  'help.guide.booking-travelers.step.4':
    'Çubuktaki “Filtrele”ye tıklayın: “Yolcular” altında yalnızca bir kişinin rezervasyonlarını görmek için o kişiye tıklayın. Birkaç kişi aynı anda seçilebilir.',
  'help.guide.booking-travelers.result':
    'Kartta rezervasyonun kimler için olduğu listelenir; “Filtrele” sekmeyi seçtiğiniz kişilerin rezervasyonlarına daraltır.',
  'help.guide.booking-travelers.tip.1':
    'Kartta ve ayrıntı görünümünde yolcular yalnızca gösterilir, orada değiştirilemez. Yolcuları burada, formda ayarlarsınız.',
  'help.guide.booking-travelers.tip.2':
    'Seyahatte birden fazla üye olduğunda ve en az bir rezervasyonda biri belirtildiğinde “Filtrele” içinde “Yolcular” görünür. Seçiminiz tarayıcı sekmesini kapatana kadar korunur.',
  // booking-files
  'help.guide.booking-files.title': "Voucher'ı rezervasyonla birlikte tutun",
  'help.guide.booking-files.goal': 'Onayı, bileti ya da geçiş kartını ait olduğu rezervasyona ekleyin.',
  'help.guide.booking-files.step.1':
    'Rezervasyonu kartındaki kalemle açın. “Dosyalar”, “Bağla”nın yanındadır; oradaki “Dosya ekle”ye tıklayın. Zaten var olan bir rezervasyonda belge hemen yüklenir ve TREK “Dosya yüklendi” yazar.',
  'help.guide.booking-files.step.2': 'Belge adıyla listelenir; yanında onu açan bir düğme ve bir X bulunur.',
  'help.guide.booking-files.step.3':
    '“Mevcut dosyayı bağla”, seyahatin henüz bu rezervasyonda olmayan belgelerini sunar. Birini seçin; hiçbir şeyi yeniden yüklemeden eklenir.',
  'help.guide.booking-files.step.4': '“Güncelle” düğmesine tıklayın.',
  'help.guide.booking-files.result':
    'Kart ve ayrıntı görünümü belgeleri Dosya altında listeler. Bir belgeye tıklayınca açılır. Ayrıntı görünümünde listenin üstündeki Dosyalarda göster sizi Dosya sekmesine götürür.',
  'help.guide.booking-files.tip.1':
    "Henüz oluşturmakta olduğunuz bir rezervasyonda belge, Ekle'ye tıkladığınızda yüklenir. Yükleme için bağlantı gerekir.",
  'help.guide.booking-files.tip.2':
    'Belgenin yanındaki X, belgeyi değil bağlantıyı kaldırır. Belge seyahatin “Dosya” sekmesinde kalır.',
  'help.guide.booking-files.tip.3':
    'Hangi dosya türlerinin eklenebileceğini yönetici “İzin Verilen Dosya Türleri” altında belirler. Belgeler, metin ve resimler varsayılan olarak izinlidir.',
  // booking-cost
  'help.guide.booking-cost.title': 'Rezervasyon fiyatını harcamaya çevirin',
  'help.guide.booking-cost.goal':
    'Bir rezervasyonun fiyatını, ödeyen kişiler arasında paylaştırarak “Maliyetler”e ekleyin.',
  'help.guide.booking-cost.step.1':
    'Rezervasyonu kartındaki kalemle açın ve formun en altına inin. “Maliyetler” altında “Harcama oluştur” ve “Mevcut harcamayı bağla” ile birlikte “Rezervasyonu kaydeder, ardından Maliyetler düzenleyicisini açar” notu yer alır.',
  'help.guide.booking-cost.step.2':
    '“Harcama oluştur”a tıklayın. Rezervasyon kaydedilir, formu kapanır ve Maliyetler düzenleyicisi “Harcama ekle” olarak açılır.',
  'help.guide.booking-cost.step.3':
    "Başlıktaki ad zaten rezervasyonun başlığıdır, Gün de zaten rezervasyonun günüdür. Toplam tutar'ı girin ve yanındaki Para birimi'ni kontrol edin.",
  'help.guide.booking-cost.step.4':
    'Başlıktaki rozet “Kategori”dir ve rezervasyon türüne uygun kategoriye önceden ayarlıdır. “Kim ödedi?” altında kimin ödediğini, “Paylaşım” altında tutarın nasıl paylaşılacağını seçin.',
  'help.guide.booking-cost.step.5': '“Harcama ekle” düğmesine tıklayın.',
  'help.guide.booking-cost.result':
    'Kart tutarı en altta gösterir, rezervasyonun formu harcamayı “Bağlı harcamalar” altında listeler ve aynı harcama bu rezervasyona bağlı olarak Maliyetler sekmesinde de görünür.',
  'help.guide.booking-cost.tip.1':
    'Kategori türe göre belirlenir: “Restoran” “Yiyecek & içecek”, “Konaklama” “Konaklama”, “Otopark” “Otopark” olur; “Etkinlik” ile “Tur” ise ikisi de “Diğer” olur.',
  'help.guide.booking-cost.tip.2':
    'Bir rezervasyonun birden çok harcaması olabilir. “Mevcut harcamayı bağla”, “Maliyetler”de henüz hiçbir şeye bağlı olmayan harcamaları sunar. Bağlı bir harcamada “Bağlantıyı kaldır, harcamayı tut” bağlantıyı kaldırır ve harcamayı “Maliyetler”de bırakır; çöp kutusu ise harcamayı siler.',
  'help.guide.booking-cost.tip.3':
    '“Maliyetler” formda yalnızca Maliyetler eklentisi açıkken bulunur; bunu yönetici “Eklentiler” altından açar ya da kapatır.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Rezervasyon bulun',
  'help.guide.filter-bookings.goal': 'Uzun bir sekmeyi bir sözcüğe, duruma, türe ya da kişiye göre filtreleyin.',
  'help.guide.filter-bookings.step.1':
    'Çubuktaki “Ara” alanına yazın. Başlıklarda, türlerde, yerlerde ve adreslerde, notlarda, rezervasyon kodlarında ve yolcu adlarında arar; yazdıkça sekmede daha az sonuç kalır. Escape kutuyu boşaltır.',
  'help.guide.filter-bookings.step.2':
    'Aramanın yanındaki huni olan “Filtrele”ye tıklayın. Panelde “Durum”, “Tür” ve bir rezervasyonda kişiler atandığında “Yolcular” bulunur.',
  'help.guide.filter-bookings.step.3':
    '“Durum” altında yalnızca onaylı ya da bekleyen rezervasyonları görmek için “Onaylandı” veya “Beklemede”yi seçin; “Tümü” ikisini de gösterir.',
  'help.guide.filter-bookings.step.4':
    '“Tür” altında yalnızca istediklerinizi tutmak için bir ya da daha fazla türe tıklayın. Her türün yanında kaç rezervasyonu olduğu yazar, seçilenler onay işaretiyle belirtilir.',
  'help.guide.filter-bookings.step.5':
    '“Filtrele” üzerindeki sayı kaç filtrenin açık olduğunu gösterir; aramanın yanındaki bir rozet de tüm rezervasyonlardan kaçının kaldığını gösterir. Her şeyi yeniden görmek için rozete ya da panelin altındaki “Filtreleri sıfırla”ya tıklayın.',
  'help.guide.filter-bookings.result':
    'Sekme yalnızca seçtiklerinizi gösterir; “Kartlar”, “Liste” ve “Zaman çizelgesi”nde aynı şekilde. Filtreler, tarayıcı sekmesini kapatana kadar bu seyahat için kalır.',
  'help.guide.filter-bookings.tip.1':
    '“Tür” yalnızca sekmede birden fazla tür varsa gösterilir ve yalnızca sekmedeki türleri listeler. Yani sekmede tur yoksa “Tür” içinde “Tur” seçeneği de yoktur.',
  'help.guide.filter-bookings.tip.2':
    'Filtreyle hiçbir şey eşleşmezse sekmede “Bu filtrelere uyan bir şey yok” yazar, hemen altında da “Filtreleri sıfırla” bulunur.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Bir rezervasyonu onay belgesinden içe aktarın',
  'help.guide.import-booking-file.goal':
    'Rezervasyonu yeniden yazmanıza gerek kalmasın diye TREK, sağlayıcının gönderdiği e-postadan ya da PDF’den okusun.',
  'help.guide.import-booking-file.step.1':
    'Çubuktaki indirme simgesine, yani “Rezervasyon onaylarını içe aktar”a tıklayın; üzerine gelince adı görünür. Aynı adlı iletişim kutusu açılır.',
  'help.guide.import-booking-file.step.2':
    'Onay belgelerini kutuya bırak ya da kutuya tıklayıp seç: EML, PDF, PKPass, HTML ve TXT, her biri en fazla 10 MB olan en çok beş dosya; yapay zeka modeli görselleri okuyabiliyorsa fotoğraflar da (JPG, PNG, WEBP). Seçtiklerinin adı kutuda görünür.',
  'help.guide.import-booking-file.step.3':
    '“İçe aktar”a tıklayın. Okuma arka planda yapıldığı için pencere hemen kapanır.',
  'help.guide.import-booking-file.step.4':
    'Sağ altta bir kart, dosyanın adının altında ilerlemeyi gösterir. Uygulamada gezinirken ve sayfa yenilendikten sonra da görünür kalır. Okuma bitince “Dosyalar işleniyor…” bir onay işaretine dönüşür ve kart “İçe aktar”ı sunar. Ona tıklayın.',
  'help.guide.import-booking-file.step.5':
    'Bulunan her rezervasyon, önceden doldurulmuş olarak sırayla “Yeni Rezervasyon” içinde açılır. Bir otel için bu, başlık olarak adı ve seyahatte yer varsa “Konaklama” altında yeri, “Konum / Adres”, gecelerine ait “Gönderen” ve “Alıcı” tarihlerini, “Giriş” ve “Çıkış”, “Rezervasyon Kodu”, “Dosya” altında onayı ve Maliyetler açıksa fiyatı “Bağlı harcama” olarak içerir. Kontrol edin ve “Ekle” düğmesine tıklayın.',
  'help.guide.import-booking-file.result':
    'Rezervasyon, geceleri, kodu ve “Dosya” altındaki onayıyla “Beklemede” altında bir kart olarak görünür. Konaklama planın o günlerinde görünür. Maliyetler açıksa fiyat, rezervasyona bağlı bir harcama olarak eklenir.',
  'help.guide.import-booking-file.tip.1':
    'İçe aktarma simgesi yalnızca sunucu onay belgelerini okuyabiliyorsa görünür. Bunun için ayıklayıcı ya da “Yapay zekâ ile ayrıştırma” eklentisi gerekir. Yönetici “Yapay zekâ ile ayrıştırma” eklentisini Eklentiler altından açar. Hiç rezervasyonu olmayan bir sekme bunu “Dosyadan içe aktar” düğmesi olarak da gösterir.',
  'help.guide.import-booking-file.tip.2':
    'Hiçbir şey okunamazsa kart bunu belirtir. “Yapay zekâ ile ayrıştırma” açıksa aynı dosyaları doğrudan modele gönderen “Yapay zekâ ile okumayı dene” seçeneğini sunar. Tamamlanan bir ayrıştırma on dakika saklanır; incelemeyi bu süre içinde başlatın.',
  'help.guide.import-booking-file.tip.3':
    'Onay yalnızca türü yönetici ayarlarındaki “İzin Verilen Dosya Türleri” arasındaysa eklenir. PDF varsayılan olarak izinlidir; e-posta dosyası (EML) önce eklenmelidir, yoksa rezervasyon onsuz kaydedilir.',
  // edit-booking
  'help.guide.edit-booking.title': 'Rezervasyonu değiştirin',
  'help.guide.edit-booking.goal':
    'Bir saati düzeltin, sonradan gelen kodu ekleyin ya da bir rezervasyonu “Beklemede”den “Onaylandı”ya taşıyın.',
  'help.guide.edit-booking.step.1':
    'Kartın üzerine gelin ve başlığındaki kaleme tıklayın. “Rezervasyonu Düzenle”, rezervasyonun tüm ayrıntılarıyla açılır.',
  'help.guide.edit-booking.step.2':
    'Değişmesi gerekeni değiştirin, örneğin işletmecinin sonradan gönderdiği “Rezervasyon Kodu”nu.',
  'help.guide.edit-booking.step.3':
    'Üstteki banttaki “Beklemede” rozetine tıklayın. “Onaylandı” olarak değişir ve bant yeşile döner.',
  'help.guide.edit-booking.step.4': '“Güncelle”ye tıklayın.',
  'help.guide.edit-booking.result':
    'Kart yer değiştirir: onaylanmış bir rezervasyon yeşil noktası ve yeşil üst şeridiyle “Onaylandı” bölümünde görünür; seyahatteki herkes bu değişikliği görür.',
  'help.guide.edit-booking.tip.1':
    'Bir Rezervasyon Kodunu okuyamıyorsanız “Ayarlar”da “Görünüm” altında “Rezervasyon Kodlarını Bulanıklaştır” açıktır. Kodu okumak için üzerine gelin ya da tıklayın.',
  'help.guide.edit-booking.tip.2':
    'Türü değiştirirseniz bağlı harcamanın kategorisi de değişir; ancak Maliyetler düzenleyicisinde kategoriyi elle seçtiyseniz değişmez.',
  'help.guide.edit-booking.tip.3':
    'Rezervasyonun ayrıntı görünümünün altındaki “Düzenle” aynı formu açar. Durumu form açmadan da değiştirebilirsiniz: bir kartın ya da satırın noktasına veya ayrıntı görünümündeki durum rozetine tıklayın.',
  // delete-booking
  'help.guide.delete-booking.title': 'Bir rezervasyonu silin',
  'help.guide.delete-booking.goal': 'İptal edilen bir rezervasyonu seyahatten kaldırın.',
  'help.guide.delete-booking.step.1':
    'Kartın üzerine gelin ve başlığındaki çöp kutusuna tıklayın. Rezervasyon ayrıntılarının altındaki çöp kutusu da aynı işi yapar.',
  'help.guide.delete-booking.step.2':
    '“Rezervasyon silinsin mi?” sorusu seçtiğin rezervasyonun adını gösterir ve rezervasyonun kalıcı olarak silineceğini söyler. Rezervasyona bağlı maliyetler varsa onların da silineceğini belirtir.',
  'help.guide.delete-booking.step.3': '“Sil”e tıklayın.',
  'help.guide.delete-booking.result':
    'Kart, seyahatteki herkes için silinir. Rezervasyon silme geri alınamaz; bu yüzden onay sorusu iptal etmek için son şansınızdır.',
  'help.guide.delete-booking.tip.1':
    'Bir rezervasyonu silmek, ona bağlı harcamaları da siler. Bir konaklamayı silmek, gecelerini de gün planından kaldırır.',
  'help.guide.delete-booking.tip.2':
    'Eklenmiş belgeler seyahatin “Dosya” sekmesinde kalır, yalnızca rezervasyonla bağlantıları kaldırılır.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Maliyetler',
  'help.ctx.trip-costs.summary':
    'Seyahatin parası: her harcama tarih sırasına göre bir defterde ya da tabloda; kimin girdiği, kimin borçlu olduğu ve fişteki para biriminde. Sağ sütun, hesabı kapatmak için kimin kime ödemesi gerektiğini gösterir.',
  'help.ctx.trip-costs.bullet.1':
    'Üstteki çubukta seyahatin tarihleri ve maliyetlerin paylaşıldığı yolcular görünür. Ayrıca “Harcamalarda ara…”, “Filtrele” (huni), “CSV dışa aktar” (indirme simgesi) ve “Liste” / “Tablo” anahtarı burada yer alır.',
  'help.ctx.trip-costs.bullet.2':
    'Sağ ucunda “Hesaplaş” açık olan tüm transferleri tek seferde kaydeder, “Fiş tara” Yapay zekâ ile ayrıştırma eklentisi görselleri okuyabiliyorsa bir fotoğraftan harcamayı doldurur, “Harcama ekle” ise düzenleyiciyi açar.',
  'help.ctx.trip-costs.bullet.3':
    'Çubuğun altında dört kart vardır: “Borcunuz” ve “Size borçlu” hesaplaşmadaki kendi tarafınızdır, “Bekleyen tutar” kaydedilmiş ama henüz ödeyeni olmayan tutardır, “Toplam seyahat harcaması” ise her şeyi toplar; altında “Sizin payınız” ve “Siz ödediniz” yer alır.',
  'help.ctx.trip-costs.bullet.4':
    'Harcama defteri güne göre gruplanır, en yeni gün başta; her günün başlığında kaç kayıt olduğu ve o gün ne kadar harcandığı yazar. Bir satırda renkli sekme olarak kategori, ad, ödeyen kişilerin etiketleri ve her birinin ödediği tutar görünür. Altında her yolcunun payıyla “Paylaşım” yer alır (onay işareti payını kimin ödediğini gösterir); ardından not ve tutar gelir. Paylaşım sonucunda başkaları sana ya da sen başkalarına borçlu kalıyorsa ayrıca “borç verdin” veya “borçlandın” yazar.',
  'help.ctx.trip-costs.bullet.5':
    'Sağ sütun sonuçları gösterir: “Hesaplaş” kimin kime ödeyeceğini listeler, “Bakiyeler” her yolcunun alacağını ya da borcunu gösterir, “Nihai bütçe” seyahatin her yolcuya neye mal olduğunu gösterir, “Kategoriye göre” ise paranın nereye harcandığını gösterir.',
  'help.ctx.trip-costs.bullet.6':
    'Kaydedilmiş bir ödeme aynı defterde kendi satırı olarak görünür; yanında bir kalem ve Geri al bulunur. Bir harcamada kalem ve çöp kutusu vardır, çöp kutusu harcamayı silmeden önce sorar. Fişi olan bir harcamanın adının yanında, fişleri açan bir Fiş etiketi görünür.',
  'help.ctx.trip-costs.bullet.7':
    'Çubuktaki “Tablo”, aynı harcamaları kategoriye göre gruplanmış bir sayfa olarak, “Kişiler” ve “Gün” ile kişi başına ve gün başına tutarla gösterir. Bu durumda “Kategoriye göre”nin yerini “Özet” alır. Maliyetler seçtiğiniz görünümü hatırlar.',
  // add-expense
  'help.guide.add-expense.title': 'Harcama ekleyin',
  'help.guide.add-expense.goal': 'Bir şeyin ne kadar tuttuğunu, kimin ödediğini ve kimlerle paylaşıldığını kaydedin.',
  'help.guide.add-expense.step.1':
    'Çubuğun sağ ucundaki “Harcama ekle”ye tıklayın. Düzenleyici bugünün tarihiyle, ödeyen siz olarak ve herkes paylaşıma dahil olarak açılır.',
  'help.guide.add-expense.step.2':
    'Harcamanın ne için olduğunu iletişim kutusunun üstündeki alana yazın. Boşken “örn. Akşam yemeği, hediyelik, benzin…” yazar. Bu harcamanın adıdır ve adsız kaydedilemez.',
  'help.guide.add-expense.step.3':
    'Adın altındaki rozet “Kategori”dir; siz başkasını seçene kadar “Yiyecek & içecek” görünür. On dört kategori vardır ve değiştirilemez. Başlık seçtiğiniz kategorinin rengini alır; satırdaki sekme ve “Kategoriye göre”deki çubuk da öyle.',
  'help.guide.add-expense.step.4':
    "Fişteki tutarı “Toplam tutar” alanına girin. Yanındaki “Para birimi” önce Maliyetler'in gösterildiği para birimine ayarlıdır. Değiştirirseniz düzenleyici dönüştürülmüş tutarı gösterir. “Gün” önce bugüne ayarlıdır ve harcama listede bu günün altında gruplanır.",
  'help.guide.add-expense.step.5':
    '“Kim ödedi?” altında parayı gerçekten ödeyen kişiye tıklayın. “Siz” önceden seçilidir. “Henüz kimse ödemedi” tutarı, kimseye borç oluşturmadan kaydeder. Başlığın yanındaki anahtarda “Birden fazla kişi ödedi” ise hesabı birkaç ödeyen arasında böler.',
  'help.guide.add-expense.step.6':
    'Aşağıdaki “Paylaşım” “Eşit” ile başlar: herkes işaretlidir ve her payı adın yanında yazar. Olduğu gibi bırakın ya da değiştirin. Kaydetmek için pencerenin altındaki “Harcama ekle”ye tıklayın.',
  'help.guide.add-expense.result':
    'Harcama defterde kendi gününün altında yer alır, “Toplam seyahat harcaması”na eklenir ve hesaplaşma sütunu kimin kime borçlu olduğunu yeniden hesaplar.',
  'help.guide.add-expense.tip.1':
    'Varsayılanları değiştirmezseniz harcama bugünün tarihli olur, sizin ödediğiniz ve herkes arasında eşit bölüşülen bir harcama sayılır: doldurmanız gereken yalnızca ad ve tutardır.',
  'help.guide.add-expense.tip.2':
    'Tutarın yanındaki ± harcamayı iadeye çevirir. Negatif toplam paranın geri ödendiği anlamına gelir ve bölüşüm tersine döner.',
  'help.guide.add-expense.tip.3':
    "Pencerenin altındaki Fişler ve Faturalar'ın yanındaki Ekle, resim ve PDF kabul eder. Dosyalar kaydettiğinizde yüklenir, seyahatin Dosya sekmesinde saklanır ve listede adın yanında bir Fiş etiketi belirir.",
  // expense-payers
  'help.guide.expense-payers.title': 'Kimin ödediğini belirtin',
  'help.guide.expense-payers.goal': 'Bir harcamayı kimin ödediğini kaydedin. Bu, hesaplaşma hesabının diğer yarısıdır.',
  'help.guide.expense-payers.step.1':
    'Satırın yanındaki kalemle bir harcamayı açın ve “Kim ödedi?” alanına bakın. Başlığın yanındaki anahtarda varsayılan “Tek kişi ödedi”dir: her yolcu bir çiptir ve çerçeveli çip ödeyen kişidir. Değiştirmek için başka bir çipe tıklayın.',
  'help.guide.expense-payers.step.2':
    'Yolculardan sonra gelen kesik çizgili çip olan “Henüz kimse ödemedi”, tutarı kimseye borç yüklemeden kaydeder. Harcama yine de “Toplam seyahat harcaması”na dahil edilir.',
  'help.guide.expense-payers.step.3':
    'O anahtarın diğer seçeneği olan “Birden fazla kişi ödedi”, her yolcuyu işaretlenecek bir kutuyla listeler ve işaretlenen her kişi için bir tutar alanı çıkar. Ödeyenleri işaretleyin ve her birinin ne kadar ödediğini yazın; tutarların toplamı toplam tutara eşit olmalıdır.',
  'help.guide.expense-payers.step.4':
    'Kimsenin ödemediği bir harcama satırında “Tamamlanmadı” olarak işaretlenir ve henüz ödeyeni olmayan harcamaları toplayan “Bekleyen tutar” kartına sayılır.',
  'help.guide.expense-payers.result':
    'Kimin ödediği kime geri ödeneceğini, bölüşüm kimin ödeyeceğini belirler; “Bakiyeler” ikisi arasındaki farktır.',
  'help.guide.expense-payers.tip.1':
    '“Kim ödedi?” ve “Paylaşım” birbirinden bağımsızdır: katılmadığınız bir yemeği siz ödeyebilir, ödemediğiniz bir yemeğin paylaşımına dahil olabilirsiniz.',
  'help.guide.expense-payers.tip.2':
    'Birden fazla ödeyen varsa tutarların toplamı toplam tutara eşit olmalıdır. Bir ödeyen daha işaretlediğinizde kalan tutar, kendiniz yazmadığınız tutarlar arasında yeniden paylaştırılır. Tutarlar uyuşmadığı sürece düzenleyici, toplamın ne olması gerektiğini gösterir ve kaydetmez.',
  'help.guide.expense-payers.tip.3':
    'Bir harcamayı yeniden “Henüz kimse ödemedi” yapmak onu silmez: tutar “Toplam seyahat harcaması” içinde kalır ve satır “Tamamlanmadı” olur.',
  // split-expense
  'help.guide.split-expense.title': 'Bir hesabı yolcular arasında bölüşün',
  'help.guide.split-expense.goal':
    'Bir harcamada kimin borçlu olduğunu belirleyin: herkes eşit, tutara göre ya da fişteki kalemlere göre.',
  'help.guide.split-expense.step.1':
    'Harcama düzenleyicisinde “Paylaşım”, her yolcuyu işaretlenecek bir kutuyla listeler. Birini bu harcamanın dışında bırakmak için adının işaretini kaldırın: ad grileşir, payını kaybeder ve bu harcama için borçlu olmaz.',
  'help.guide.split-expense.step.2':
    'Başlığın yanındaki anahtarda “Eşit” varsayılandır: işaretli her yolcu, adının yanında gösterilen aynı payı alır. Listenin altındaki rozetler payı kaç kişinin paylaştığını ve her payın ne kadar olduğunu gösterir.',
  'help.guide.split-expense.step.3':
    '“Özel”, payların yerine tutar alanlarını getirir. Her yolcunun ne kadar borçlu olduğunu yazın. Alttaki rozet siz yazdıkça güncellenir ve “Bölüşüm toplamla eşleşiyor” olunca yeşile döner. Tutarlar toplamla eşleşmedikçe kaydedemezsiniz.',
  'help.guide.split-expense.step.4':
    '“Fiş”, fişi satır satır böler: “Kalem ekle”, ardından her satır için bir ad ve fiyat girin, “Bölüşülüyor:” yanında da o satırı paylaşan yolcuları seçin.',
  'help.guide.split-expense.step.5':
    'Satırların altındaki “Kişi başı pay”, her yolcunun sonunda ne kadar borçlu olduğunu gösterir, üstteki “Toplam tutar” ise satırların toplamıdır. Pencerenin altındaki “Kaydet” düğmesine tıklayın.',
  'help.guide.split-expense.result':
    'Tüm bakiyeler bu paylaşıma göre hesaplanır. Paylaşım harcamayla birlikte kaydedilir, satırında her yolcunun payıyla Paylaşım olarak görünür ve sonradan başka hiçbir şeye dokunmadan değiştirilebilir.',
  'help.guide.split-expense.tip.1':
    'İşaretini kaldırdığınız yolcu, yalnızca bu harcama için hiçbir şey ödemez. Diğerleri kendi paylarını öder.',
  'help.guide.split-expense.tip.2':
    '“Eşit” bölüşüm kuruşu kuruşuna yapılır: artan kuruş her harcamada farklı birine verilir, böylece hep aynı kişi ödemez.',
  'help.guide.split-expense.tip.3':
    '“Fiş” kipi “Toplam tutar”ı kendisi hesaplar ve alanı grileştirir: toplam, fişin satırlarının toplamıdır.',
  'help.guide.split-expense.tip.4':
    'Özel bölüşüm yüzde olarak da girilebilir: “Payları şu şekilde gir” ayarını % olarak değiştirin; harcama kaydedilmeden önce payların toplamı %100 olmalıdır.',
  // expense-currency
  'help.guide.expense-currency.title': 'Başka bir para biriminde harcama girin',
  'help.guide.expense-currency.goal': 'Fişteki tutarı girin, döviz kurunu TREK kaydetsin.',
  'help.guide.expense-currency.step.1':
    '“Harcama ekle”yi açın. Adı pencerenin üstüne yazın ve tutarı “Toplam tutar” alanına fişte yazdığı gibi, çevrilmiş bir tutar olarak değil, aynen girin.',
  'help.guide.expense-currency.step.2':
    "Tutarın yanındaki “Para birimi”ni açın ve fişteki para birimini seçin. Liste TREK'in bildiği tüm kodları içerir ve arama yapabilirsiniz: üç harfi yazın.",
  'help.guide.expense-currency.step.3':
    'Alanların altında bir rozet sırası belirir: yazdığınız tutar ve şu anki karşılığı, “anlık kur” olarak işaretli. Bu yalnızca bir önizlemedir; kaydedilen değer bu değildir.',
  'help.guide.expense-currency.step.4':
    'Pencerenin altındaki “Harcama ekle”ye tıklayın. Kur o anda sabitlenir: bu harcama, girdiğiniz günkü değerini korur.',
  'help.guide.expense-currency.step.5':
    'Defterde satır, adın altında iki tutarı da gösterir: yazdığınız tutar, bir ok ve seyahatin para birimindeki karşılığı. “Maliyetler” sekmesindeki her toplam, bakiye ve hesaplaşma ikinci tutarı kullanır.',
  'help.guide.expense-currency.result':
    'Harcama, yazdığınız tutarı ve para birimini korur. Defter ikisini de gösterir; seyahatin toplamları ve bakiyeleri ise seyahatin para biriminde hesaplanır.',
  'help.guide.expense-currency.tip.1':
    'Kur kaydettiğiniz anda sabitlenir, bu yüzden hesaplaşılmış bir borç, kur ertesi hafta değişse de değişmez. Yeni bir kur yalnızca harcamanın para birimini değiştirdiğinizde kaydedilir.',
  'help.guide.expense-currency.tip.2':
    "Ayarlar'daki “Görüntüleme para birimi” yalnızca tutarların nasıl gösterileceğini değiştirir. Kaydedilen tutarlar hiç değişmez. Boşsa her seyahat kendi para biriminde gösterilir.",
  'help.guide.expense-currency.tip.3':
    'Seyahat para birimi seyahatin kendisinde, “Seyahati Düzenle” altında ayarlanır ve “Seyahat ayrıntılarını düzenle” izni gerektirir. Değiştirirseniz sabitlenmiş tüm kurlar yeni para birimi için yeniden hesaplanır. Tutarların kendisi çevrilmez.',
  // filter-costs
  'help.guide.filter-costs.title': 'Bir harcamayı ya da bir günün harcamalarını bulun',
  'help.guide.filter-costs.goal': 'Uzun bir harcama listesini, yalnızca aradıklarınızı gösterecek şekilde filtreleyin.',
  'help.guide.filter-costs.step.1':
    'Çubuktaki “Harcamalarda ara…” alanına yazın. Yazdıkça harcamanın adıyla eşleştirir; Esc onu yeniden temizler.',
  'help.guide.filter-costs.step.2':
    'Aramanın yanındaki huni olan “Filtrele” filtreleri açar. En üstteki anahtar defteri kendi açınızdan görmenizi sağlar: “Tümü”, ödediğiniz harcamalar için “Benim ödediklerim” ve payınızdan fazlasını ödediğiniz harcamalar için “Bana borçlu”.',
  'help.guide.filter-costs.step.3':
    '“Kategori” altında on dört kategoriden birini seçin, yalnızca o kategorinin harcamaları gösterilir. Huni simgesi kaç filtrenin açık olduğunu gösterir.',
  'help.guide.filter-costs.step.4':
    '“Gün” altında harcama yapılmış günlerden birini seçin. Gün başlıklarının yerini bir şerit alır ve o günü eksiksiz gösterir: kaç harcaması olduğunu ve toplamını.',
  'help.guide.filter-costs.step.5':
    'Huninin yanındaki indirme simgesi olan “CSV dışa aktar”, tüm harcamaları özgün tutar, para birimi ve çevrilmiş tutarla birlikte bir dosyaya kaydeder.',
  'help.guide.filter-costs.result':
    'Filtreleri birleştirebilirsiniz; gün grupları, geriye kalan harcamaların kendi toplamlarıyla güncellenir.',
  'help.guide.filter-costs.tip.1':
    'Kaydedilen ödemelerin adı ve kategorisi yoktur, bu yüzden arama veya kategori filtresi onları gizler; “Bana borçlu” da gizler. Gün filtresi ise onları ödemenin yapıldığı günün altında tutar.',
  'help.guide.filter-costs.tip.2':
    '“CSV dışa aktar”, ekranda ne filtrelenmiş olursa olsun her zaman tüm harcamaları, harcama başına bir satır olarak dışa aktarır.',
  'help.guide.filter-costs.tip.3':
    'Bir filtre açıkken filtre menüsünün altında beliren “Filtreleri sıfırla” hepsini tek seferde kapatır.',
  // settle-up
  'help.guide.settle-up.title': 'Kimin kime borçlu olduğunu görün ve hesaplaşın',
  'help.guide.settle-up.goal':
    'Birçok ortak harcamayı tüm borçları kapatan en az sayıda transfere dönüştürün ve transferler yapıldıkça kaydedin.',
  'help.guide.settle-up.step.1':
    'Sağ sütundaki “Hesaplaş” kartı, tüm borçları kapatacak transferleri listeler: kimin kime ödeyeceği iki avatar olarak (adlar ipucunda yazar) ve ne kadar ödeyeceği. Başlıktaki sayı kaç transferin hâlâ açık olduğunu gösterir.',
  'help.guide.settle-up.step.2':
    'Bir transferin yanındaki “Hesaplaş”, transferi yapıldı olarak kaydeder. Transfer karttan kaybolur ve bakiyeler güncellenir.',
  'help.guide.settle-up.step.3':
    'Kaydedilen transfer defterde bir satır olarak, gerçekleştiği günün altında yer alır; iki yolcu ve tutarla birlikte “Ödeme” olarak işaretlenir.',
  'help.guide.settle-up.step.4':
    'O satırın yanındaki kalem bir ödemeyi düzeltir, “Geri al” ise iptal eder; transfer yeniden “Hesaplaş” kartına döner.',
  'help.guide.settle-up.step.5':
    'Kartın başlığındaki “Ödeme ekle”, bir öneriye uymayan bir transferi kaydeder. “Nereden” ve “Nereye” kişilerini, tutarı, para birimini ve ödemenin yapıldığı günü seç; istersen ödemenin nasıl yapıldığı gibi bir “Not” ekle, sonra pencerenin altında “Ödeme ekle”ye tıkla.',
  'help.guide.settle-up.step.6':
    'En üstteki çubukta “Hesaplaş”, açık olan tüm transferleri sormadan tek seferde kaydeder; örneğin grup seyahat sonunda tüm borçları kapattığında.',
  'help.guide.settle-up.result':
    'Kaydedilen her transfer defterde bir satır olur ve “Hesaplaş” kartından bir satır eksilir. Kartta “Herkesin hesabı kapalı” yazdığında seyahatin tüm borçları ödenmiştir.',
  'help.guide.settle-up.tip.1':
    'Kart her borcu değil, en az sayıda transferi gösterir: üç kişi birbirine döngü halinde borçluysa bu bir ya da iki ödemeye iner.',
  'help.guide.settle-up.tip.2':
    '“Hesaplaş” yalnızca bir transferi kaydeder, para göndermez. Parayı her zamanki ödeme yönteminizle gönderin, sonra “Hesaplaş”a tıklayın.',
  'help.guide.settle-up.tip.3':
    'Ödeme herhangi bir para biriminde yapılabilir, yani yen cinsinden bir borcu euro ile ödemek normaldir: pencerenin kendi para birimi seçicisi vardır ve o kuru da sabitler.',
  // final-budget
  'help.guide.final-budget.title': 'Seyahatin her yolcuya ne kadar tuttuğunu görün',
  'help.guide.final-budget.goal': 'Her kişiye ait rakamları görün: bugünkü bakiye ve kişi başına gerçek maliyet.',
  'help.guide.final-budget.step.1':
    '“Bakiyeler” her yolcunun durumunu gösterir: seyahat ona borçluysa sağa doğru yeşil bir çubuk, o seyahate borçluysa sola doğru kırmızı bir çubuk ve adın yanında tutar.',
  'help.guide.final-budget.step.2':
    'Altındaki “Nihai bütçe” farklı bir soruyu yanıtlar: şu anda kimin kime ne borçlu olduğunu değil, her şey geri ödendikten sonra seyahatin her yolcuya ne kadar tuttuğunu.',
  'help.guide.final-budget.step.3':
    'Hesabı görmek için bir ada tıklayın: “Ödenen harcamalar”, altında da “Net geri ödemeler” ve “Bekleyen geri ödemeler”.',
  'help.guide.final-budget.step.4':
    'Üç satırın altında her yolcunun adı altında, o satırı oluşturan kalemlerin listesi bulunur: o yolcunun ödediği harcamalar, kaydedilmiş transferler ve hâlâ açık olan transferler. Her liste, aynı adlı satırın tutarını tam olarak verir.',
  'help.guide.final-budget.result':
    '“Bakiyeler”, bugün kimin alacaklı, kimin borçlu olduğunu gösterir. “Nihai bütçe”, her şey geri ödendiğinde seyahatin her birinize neye mal olduğunu gösterir.',
  'help.guide.final-budget.tip.1':
    'Bir ödemeyi kaydetmek kimsenin nihai bütçesini değiştirmez. Yalnızca bir tutarı bekleyen geri ödemelerden net geri ödemelere taşır.',
  'help.guide.final-budget.tip.2':
    'Ödeyeni olmayan bir harcama, hesaplaşma önerilerinin dışında kaldığı gibi iki kartın da dışında kalır.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Rezervasyonu harcamaya dönüştürün',
  'help.guide.expense-from-booking.goal':
    'Bir uçuşun, otelin ya da yerin gerçekte ne kadar tuttuğunu ait olduğu kayda ekleyin.',
  'help.guide.expense-from-booking.step.1':
    'Rezervasyonu Ulaşım ya da Rezervasyonlar sekmesinde bulun ve kartının üstündeki kaleme tıklayın.',
  'help.guide.expense-from-booking.step.2':
    "Formun sonuna yakın “Maliyetler” bölümüne gidin. Burada, önce rezervasyonu kaydeden “Harcama oluştur” ve Maliyetler'de zaten bulunan bir harcama için “Mevcut harcamayı bağla” seçenekleri vardır.",
  'help.guide.expense-from-booking.step.3':
    "Harcama oluştur'a tıklayın. Rezervasyon kaydedilir, form kapanır ve Maliyetler düzenleyicisi açılır: ad olarak rezervasyonun başlığı, bir kategoriyle eşleşmiş türü ve harcamanın günü olarak rezervasyonun günü hazır gelir.",
  'help.guide.expense-from-booking.step.4':
    'Tutarı ve para birimini, kimin ödediğini ve paylaşımı her harcamada olduğu gibi doldurun ve “Harcama ekle” düğmesine tıklayın. Rezervasyonu yeniden açtığınızda harcama “Bağlı harcamalar” altında görünür: düzenlemek için bir kalem, bağlantıyı kaldırıp harcamayı tutmak için “Bağlantıyı kaldır, harcamayı tut” ve silmek için bir çöp kutusu vardır.',
  'help.guide.expense-from-booking.result':
    'Rezervasyon maliyetini gösterir ve harcama, Maliyetler sekmesinde ödeyen, paylaşım ve para birimiyle diğerleri gibi normal bir satırdır.',
  'help.guide.expense-from-booking.tip.1':
    'Rezervasyonu silmek bağlı harcamalarını da siler ve onay sorusu bunu belirtir. Rezervasyonun Maliyetler bölümündeki Harcamayı kaldır bunun tersini yapar: harcamayı siler, rezervasyonu tutar. Bağlantıyı kaldır, harcamayı tut ikisini de korur.',
  'help.guide.expense-from-booking.tip.2':
    'Bir yerin formunda da aynı blok vardır; orada “Harcama oluştur” önce yeri kaydeder.',
  // costs-table
  'help.guide.costs-table.title': 'Maliyetleri tabloda planlayın',
  'help.guide.costs-table.goal':
    'Harcamaları kategoriye göre sıralanmış, kişi başı ve gün başı hesaplanmış bir tablo olarak okuyun ve değiştirin.',
  'help.guide.costs-table.step.1':
    'Çubuktaki “Liste” / “Tablo” anahtarının ikinci simgesi olan “Tablo”ya tıklayın. Aynı harcamaların tablosu defterin yerini alır; arama ve filtreler tabloya da uygulanır.',
  'help.guide.costs-table.step.2':
    'Tablo kategoriye göre gruplanır. Her grup başlığında adı, kaç harcaması olduğu ve ara toplamı yer alır; grubu daraltmak için başlığa tıkla. Sütunlar şöyle: “Ad”, “Tarih”, “Toplam”, “Kişiler” ve “Gün”; bunlardan hesaplanan “Kişi Başı”, “Gün Başı” ve “Kişi/gün” ise gri zemindedir. En alttaki “Toplam” satırı hepsini toplar.',
  'help.guide.costs-table.step.3':
    "Doğrudan değiştirmek için bir hücreye tıklayın: ad, toplam, “Kişiler” veya “Gün”. Yazın, kaydetmek için Enter'a basın ya da başka bir yere tıklayın, vazgeçmek için Esc'ye basın. Tarih hücresi takvimi açar. “Kişi Başı” ve hesaplanan diğer sütunlar hemen güncellenir.",
  'help.guide.costs-table.step.4':
    'Kilitli bir toplam burada değiştirilemez: biri onu ödemiştir ya da başka bir para biriminde girilmiştir ve ipucu hangisi olduğunu söyler. Ona tıklamak bunun yerine harcamayı açar, böylece bakiyeler ve sabitlenmiş döviz kuru doğru kalır.',
  'help.guide.costs-table.step.5':
    'Bir kategorinin sonundaki “Harcama ekle”, o kategoriye “Yeni Kayıt” adlı bir satır ekler; tarihi oradaki en son kayıtla aynıdır. Ad alanı değiştirebilmeniz için zaten açıktır. Toplamı da aynı şekilde girin.',
  'help.guide.costs-table.step.6':
    'Bu görünümde sağ sütunda “Kategoriye göre” yerine “Özet” yer alır. Harcamaları dört şekilde toplar: “Kategori”, “Gün”, “Ödeyen” (ödenmemişler için “Henüz ödeyen yok” ile) ve “Durum” (“Ödendi” ile “Açık”).',
  'help.guide.costs-table.result':
    'Her harcama kendi kategorisinde, kişi başı ve gün başı tutarıyla gösterilir. Bir hücredeki toplamı değiştirdiğinizde üstteki kartlar ve “Özet” hemen güncellenir.',
  'help.guide.costs-table.tip.1':
    '“Maliyetler” görünümü bu tarayıcıda hatırlar: siz yeniden “Liste”ye tıklayana kadar tabloyla açılır.',
  'help.guide.costs-table.tip.2':
    '“Özel” ya da “Fiş” ile bölüşülen bir harcamada kişi başına tek bir pay yoktur; bu yüzden “Kişi Başı” ve “Kişi/gün” boş kalır.',
  'help.guide.costs-table.tip.3':
    'Ödeyenleri, paylaşımı, notu ve fişleri harcamanın kendisinde düzenlersiniz: satır sonundaki “Diğer seçenekler” içinde “Düzenle” ve satırı kaldıran “Sil” bulunur.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Ulaşım',
  'help.ctx.trip-transports.summary':
    "Duraklar arasında yolculuk ettiğiniz tüm yollar: uçuşlar, trenler, otobüsler, arabalar, taksiler, bisikletler, gemi turları, feribotlar, teleferikler ve TREK'in sizin için aradığı toplu taşıma bağlantıları. Sekme bunları listeler. Ayrıca planda da oluşturup görüntüleyebilirsiniz, haritada da çizilirler.",
  'help.ctx.trip-transports.bullet.1':
    'Bu sekme yalnızca yolculukları gösterir. Konaklama, restoranlar, etkinlikler ve biletler “Rezervasyonlar” sekmesindedir, böylece aynı kayıt iki kez görünmez.',
  'help.ctx.trip-transports.bullet.2':
    "Üstteki çubukta “Ara”, durum, türler ve yolcular için “Filtrele”, “Kartlar”, “Liste” ve “Zaman çizelgesi” olmak üzere üç görünüm, “Görünüm seçenekleri” ve gösterilenleri indiren “Tablo olarak dışa aktar (CSV)” bulunur. Sağdaki “Ulaşım” elle bir yolculuk ekler. Ondan önceki simgeler, “Rezervasyon onaylarını içe aktar” ve “AirTrail'den içe aktar”, sunucu onayları okuyabiliyorsa ya da bir AirTrail bağlıysa görünür. Boş bir sekmede aynı işlemler ortada “Ulaşım”, “Dosyadan içe aktar” ve AirTrail olarak yer alır.",
  'help.ctx.trip-transports.bullet.3':
    'Sekme “Kartlar” görünümünde açılır: önce “Onaylandı”, sonra “Beklemede”. Her bölümü başlığına tıklayarak daraltabilirsiniz. Planlanmış toplu taşıma bağlantılarının durumu yoktur; “Görünüm seçenekleri” onlara “Otomatik toplu taşıma” adlı ayrı bir bölüm vermedikçe, onaylanmış yolculukların arasında zaman sırasına göre yer alırlar. “Liste” günlere göre gruplar, “Zaman çizelgesi” ise seyahatin günleri boyunca her yolculuğu gösterir.',
  'help.ctx.trip-transports.bullet.4':
    'Bir kartın üst şeridi durumuna göre renklenir: onaylananlar için yeşil, bekleyenler için kehribar, planlanmış bağlantı için mavi. Şeritte durum noktası, tür, başlık, kalem ve çöp kutusu bulunur. Altında şunlar yer alır: “Tarih”, “Zaman”, “Rezervasyon Kodu”, “Rota” ve havayolu ile uçuş numarası ya da tren numarası, peron ve koltuk. Ayrıntıları açmak için karta tıklayın.',
  'help.ctx.trip-transports.bullet.5':
    'Ulaşımı planda da ekleyebilirsin: bir günün başlığındaki + (ipucu “Güne ekle”) ya da başlığa sağ tık “Ulaşım ekle” ve “Toplu taşıma”yı sunar. İki durak arasındaki yolculuk süresi bağlantısı, yalnızca o bölüm için aynı aramayı açar.',
  'help.ctx.trip-transports.bullet.6':
    'İki ucu da ayarlanmış bir ulaşım haritaya bir çizgi çizer. Gün planındaki satırındaki rota simgesi ve ayrıntılarındaki “Haritada” bu çizgiyi açar. Günlerin üstündeki araç çubuğundaki “Tüm rezervasyon rotalarını göster” ise tüm seyahatin çizgilerini açar ya da kapatır.',
  // transports-list
  'help.guide.transports-list.title': '“Ulaşım” sekmesini okuyun',
  'help.guide.transports-list.goal': 'Üzerinde bir şey değiştirmeden önce listenin neleri gösterdiğini anlayın.',
  'help.guide.transports-list.step.1':
    '“Ulaşım”, seyahatin “Plan” sekmesinden (ve eklenti açıksa “Turlar”dan) sonra gelen bir sekmedir. Yalnızca yolculukları içerir: oteller, restoranlar, etkinlikler ve biletler “Rezervasyonlar” sekmesindedir.',
  'help.guide.transports-list.step.2':
    "Çubuğun solundaki Ara, siz yazdıkça yolculukları daraltır. Yanındaki huni simgesi olan Filtrele seçenekleri açar: Durum altında Tümü, Onaylandı ve Beklemede, ardından kullanımdaki her tür sayısıyla birlikte listelenir. Yalnızca bunları görmek için bir ya da birkaç tür işaretleyin. Hunideki sayı kaç filtrenin açık olduğunu gösterir, çubuk da kaç yolculuğun listelendiğini söyler, örneğin 4 yolculuktan 1'i. Menünün altındaki Filtreleri sıfırla tüm yolculukları yeniden gösterir.",
  'help.guide.transports-list.step.3':
    'Yanındaki “Kartlar”, “Liste” ve “Zaman çizelgesi”, ulaşımları kart olarak, güne göre gruplanmış satırlar olarak ya da seyahatin günleri boyunca çubuklar olarak gösterir. Kaydırıcı simgeli “Görünüm seçenekleri”, “Kartlar” ve “Liste” için “Gruplandır” ile “Sırala” ayarlarını, “Zaman çizelgesi” için şeritleri belirler. “Görünümü sıfırla” varsayılanlara döner. “Kartlar” içinde “Toplu taşıma ayrı bir bölümde” seçeneği, planlanan bağlantıları “Otomatik toplu taşıma” altında gösterir.',
  'help.guide.transports-list.step.4':
    'Her kart tüm ayrıntıları gösterir. Üstteki bant “Onaylandı” için yeşil, “Beklemede” için kehribar renklidir ve durum noktasını, türü ve başlığı gösterir. Altında “Tarih” kapsadığı günleri tarihleriyle gösterir. Sonra “Zaman”, “Rezervasyon Kodu”, duraklar arasında türün simgesiyle “Rota” ve havayolu ile uçuş numarası ya da tren numarası, peron ve koltuk gelir. Ayrıntıları açmak için karta tıklayın.',
  'help.guide.transports-list.step.5':
    'Yolculuğu Beklemede ile Onaylandı arasında değiştirmek için durum noktasına tıklayın. İpucu hangi yöne geçeceğini söyler, örneğin Beklemede olarak ayarla. Başlıktaki kalem ulaşımın formunu açar. Çöp kutusu ise önce, bağlı maliyetler dahil nelerin silineceğini sayan Rezervasyon silinsin mi? sorusunu sorar, sonra siler.',
  'help.guide.transports-list.result':
    'Her kart yolculuğun rezerve edilip edilmediğini gösterir; çubuğu kullanarak listeyi istediğiniz zaman filtreleyebilir ya da sıralayabilirsiniz.',
  'help.guide.transports-list.tip.1':
    'Sekme ayarlarınızı hatırlar: görünümü, gruplamayı ve sıralamayı bu tarayıcıda; daraltılmış bölümleri her seyahat için ayrı; filtreleri de tarayıcı sekmesini kapatana kadar.',
  'help.guide.transports-list.tip.2':
    "“Ulaşım”dan önceki iki simge, “Rezervasyon onaylarını içe aktar” ve “AirTrail'den içe aktar”, yalnızca sunucu onayları okuyabiliyorsa ve bir AirTrail örneği bağlıysa görünür. Bunlar yoksa listeyi elle ya da toplu taşıma aramasıyla doldurursunuz.",
  // add-transport
  'help.guide.add-transport.title': 'Bir güne ulaşım ekleyin',
  'help.guide.add-transport.goal': 'Sizi bir duraktan diğerine götüren ulaşımı, gerçekleştiği güne ekleyin.',
  'help.guide.add-transport.step.1':
    "Yolculuğun yapıldığı günün başlığında, ipucu Güne ekle olan + simgesine tıklayın ve Ulaşım ekle'yi seçin. Günün başlığına sağ tıklamak da aynı menüyü açar. Form o gün zaten doldurulmuş olarak açılır.",
  'help.guide.add-transport.step.2':
    'Başlıktaki tür etiketi ulaşım türünü gösterir, varsayılan olarak Uçuş. Uçuş, Tren, Otobüs, Araba, Taksi, Bisiklet, Gemi turu, Feribot, Teleferik ya da Diğer için ona tıklayın; form türe göre değişir: uçuşta her durak için bir havalimanı, trende bir istasyon zinciri, gemi turunda Biniş, Uğrak limanı ve İniş, arabada Alış, İade ve Yol üzerindeki duraklar bulunur.',
  'help.guide.add-transport.step.3':
    'Başlığı doğrudan üstteki banda, gri örnek metnin durduğu yere yazın. Zorunlu tek alan budur: doldurana kadar altındaki satırda “Başlık *” yazar ve “Ekle” gri kalır. Kalkış panosunda tanıyacağınız bir başlık kullanın.',
  'help.guide.add-transport.step.4':
    '“Rota” altında “Gönderen” ve “Alıcı” alanları bir istasyon, liman ya da adres alır. Siz yazmadan önce seyahatin kendi yerleri sunulur. Aramak için en az üç harf yazın ve bir sonuç seçin. Yalnızca yazıp sonuçlardan seçmediğiniz bir ad kaydedilmez ve haritada hiçbir şey gösterilmez.',
  'help.guide.add-transport.step.5':
    '“Tarih” ve “Başlangıç zamanı” yolculuğun ne zaman başladığını, “Bitiş tarihi” ve “Bitiş zamanı” ne zaman bittiğini belirtir; ertesi gün varan bir yolculukta buraya ertesi günü girin. Daha aşağıdaki “Rezervasyon Kodu” ve “Notlar” isteğe bağlıdır. Başlıktaki “Beklemede” rozetine tıklayarak durumu “Onaylandı” yapın.',
  'help.guide.add-transport.step.6': '“Ekle”ye tıklayın.',
  'help.guide.add-transport.result':
    'Ulaşım, günde duraklar arasında kendi saatinde bir satır olarak ve “Ulaşım” sekmesinde “Beklemede” ya da “Onaylandı” altında bir kart olarak görünür.',
  'help.guide.add-transport.tip.1':
    'Satır, başlangıç saatine göre, daha erken başlayan son duraktan sonra yerleşir. Tutamağından sürükleyerek günün içinde başka bir konuma ya da başka bir güne taşıyabilirsiniz.',
  'help.guide.add-transport.tip.2':
    'Bileti eklemek için “Dosya” bölümündeki “Dosya ekle” düğmesini kullanın. “Maliyetler” bölümündeki “Harcama oluştur” rezervasyonu kaydeder ve bilet ücreti için Maliyetler düzenleyicisini açar.',
  'help.guide.add-transport.tip.3':
    'Formun ilk bloğu olan “Yolcular”, bu ulaşıma kimlerin bineceğini belirler. Seyahatte birden fazla üye olduğunda ve bir ulaşımda biri belirtildiğinde, sekmedeki “Filtrele” seçeneği “Yolcular”ı da sunar; bu, yalnızca tek bir kişinin ulaşımlarını gösterir.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Bir uçuşu e-biletinden içe aktarın',
  'help.guide.import-transport-file.goal':
    'Taşıyıcının gönderdiği biletten uçuşu, treni ya da feribotu TREK okusun; kaydetmeden önce siz kontrol edin.',
  'help.guide.import-transport-file.step.1':
    '“Ulaşım” sekmesinin çubuğunda “Ulaşım”dan önceki indirme simgesine tıkla; ipucunda “Rezervasyon onaylarını içe aktar” yazar. Aynı adlı pencere açılır, “Rezervasyonlar” sekmesindekiyle aynıdır. Boş bir sekmede ortadaki “Dosyadan içe aktar” da aynı işi yapar.',
  'help.guide.import-transport-file.step.2':
    'Bileti kutuya bırakın ya da kutuya tıklayıp dosyayı seçin. Desteklenenler: EML, PDF, PKPass, HTML ve TXT (her biri en fazla 10 MB, en çok beş dosya) ve sunucunuzda okuyabilecek bir yapay zeka modeli varsa bilet fotoğrafları (JPG, PNG, WEBP). Seçtiğiniz dosyaların adları kutuda görünür.',
  'help.guide.import-transport-file.step.3':
    '“İçe aktar”a tıklayın. Pencere hemen kapanır ve dosya arka planda okunur.',
  'help.guide.import-transport-file.step.4':
    'Sağ altta bir kart, dosyanın adının altında ilerlemeyi gösterir. Okuma bitince “Dosyalar işleniyor…” bir onay işaretine dönüşür ve kart “İçe aktar”ı sunar. Ona tıklayın.',
  'help.guide.import-transport-file.step.5':
    'Uçuş, “Ulaşım ekle” içinde önceden doldurulmuş olarak açılır: tür rozeti “Uçuş” olur, başlıkta havayolu ve uçuş numarası başlık olarak yer alır; “Rota” altında iki havalimanı “Kalkış” ve “Varış” ile, saatleri ve saat dilimleriyle gelir; ayrıca “Havayolu”, “Uçuş No.”, “Rezervasyon Kodu” ve “Dosyalar” altında bilet doldurulur. Kontrol edin ve “Ekle”ye tıklayın.',
  'help.guide.import-transport-file.result':
    'Uçuş, “Ulaşım” sekmesinde “Beklemede” altında bir kart ve kalkış gününde bir satır olarak görünür, bilet “Dosya” bölümündedir. İki havalimanı da biliniyorsa uçuş haritada eğri olarak çizilir.',
  'help.guide.import-transport-file.tip.1':
    'İki sekme aynı içe aktarmayı kullanır. İçinde uçuş ve otel olan bir dosya, hangi sekmeden başlarsanız başlayın, önce uçuşu “Ulaşım ekle” içinde, sonra oteli “Yeni Rezervasyon” içinde açar.',
  'help.guide.import-transport-file.tip.2':
    'Havalimanları kodlarına göre yerleştirilir. Bir istasyon ya da liman konumlandırılamazsa adı, sağ alttaki içe aktarma kartında kehribar renkte gösterilir. “Ekle”ye tıklamadan önce onu “Rota” altında elle seçin, aksi halde ulaşım haritada gösterilmez.',
  // plan-transit
  'help.guide.plan-transit.title': 'Toplu taşıma bağlantısı planlayın',
  'help.guide.plan-transit.goal':
    'TREK, bir günün iki noktası arasındaki gerçek tren ve otobüsleri bulsun; seçtiğinizi plana ekleyin.',
  'help.guide.plan-transit.step.1':
    'Günün başlığındaki + işaretine tıklayın ve “Toplu taşıma”yı seçin. Arama o gün için açılır: gün başlıkta bir rozet olarak görünür, yanındaki “Elle” ve “Otomatik” bu arama ile normal form arasında geçiş yapar.',
  'help.guide.plan-transit.step.2':
    "Gönderen ve Nereye alanlarına bir durak ya da istasyon girilir. Kutu boşken TREK günün konaklamasını, günün rezervasyonlarındaki istasyonları ve havalimanlarını ve günün kendi duraklarını önerir. İki harf yazdığınızda ise tarifedeki istasyonlarda arar. İki kutu arasındaki Değiştir, Gönderen ile Nereye'yi birbiriyle değiştirir.",
  'help.guide.plan-transit.step.3':
    'Saatle birlikte “Kalkış” ya da “Varış”, ne zaman yolculuk etmek istediğinizi; “En iyi rota”, “Daha az aktarma” ya da “Daha az yürüme” ise sonuçların nasıl sıralanacağını belirler.',
  'help.guide.plan-transit.step.4':
    'Alttaki çipler hangi türlerin kullanılabileceğini gösterir: Tren, Metro, Tramvay, Otobüs, Feribot ve Teleferik. Birini hariç tutmak için kapatın, en az biri açık kalır. Sonra “Ara” düğmesine tıklayın.',
  'help.guide.plan-transit.step.5':
    'Her sonuç kalkış ve varışı, ne kadar sürdüğünü, kaç aktarma ve ne kadar yürüme gerektiğini gösterir; hatlar rozet olarak, tarife verisi sağlıyorsa kendi renkleriyle görünür. Etapları görmek için birine tıklayıp genişletin: bindiğiniz ve aktarma yaptığınız duraklar, peronlar ve hatlar arasındaki yürüyüşler listelenir.',
  'help.guide.plan-transit.step.6': '“Güne ekle”ye tıklayın.',
  'help.guide.plan-transit.result':
    'Bağlantı, o günde hat rozetleriyle birlikte bir satır olarak görünür. Her etabı görmek için satırın okuna tıklayın. “Ulaşım” sekmesinde de onaylanmış yolculukların arasında mavi bir kart olarak yer alır.',
  'help.guide.plan-transit.tip.1':
    'Bağlantılar, herkese açık tarife verilerini kullanan ücretsiz bir topluluk hizmeti olan Transitous’tan gelir: anahtar ya da hesap gerekmez. Yönetici aramayı bunun yerine Google’ı kullanacak şekilde ayarlayabilir.',
  'help.guide.plan-transit.tip.2':
    'Bir şey bulunamadı mı? Veri kaynakları belirli bir bölgeyi ve dönemi kapsar. Başka bir saat deneyin, daha fazla ulaşım biçimini açın ya da yerin kendisi yerine bir istasyon seçin. İletide yanıt veren hizmetin adı yazar. Tarihsiz bir seyahatte arama yapılacak gün olmadığı için yalnızca olağan form sunulur.',
  'help.guide.plan-transit.tip.3':
    'Aynı arama tek bir etap için de açılır: iki durak arasındaki yolculuk süresi bağlantısına tıklayın ve “Toplu taşıma”yı seçin. “Nereden”, “Nereye” ve kalkış saati sizin için doldurulur.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Planlanmış bir bağlantıyı açın ve değiştirin',
  'help.guide.change-transit-route.goal':
    'Bağlantıyı satır satır okuyun, adını değiştirin ya da rotayı yeniden arayın.',
  'help.guide.change-transit-route.step.1':
    '“Ulaşım” sekmesinde planlanmış bir bağlantı, üst bandı mavi bir karttır ve onaylanmış ulaşımlarla birlikte zaman sırasıyla listelenir. “Görünüm seçenekleri” altında “Toplu taşıma ayrı bir bölümde” açıksa bağlantı bunun yerine “Otomatik toplu taşıma” altında görünür. Karta tıklayın. Bağlantı bir rezervasyon olarak açılır.',
  'help.guide.change-transit-route.step.2':
    'Üstteki kutucuklar kalkışı ve varışı duraklarıyla, ayrıca “Süre”, “Aktarma” ve “Yürüyüş” değerlerini gösterir. Altlarındaki “Güzergah”, bağlantıyı satır satır, saatler, peronlar ve hatlar arasındaki yürüyüşlerle birlikte gösterir.',
  'help.guide.change-transit-route.step.3':
    'Rezervasyonun altındaki “Rotayı değiştir” aramayı yeniden açar; bu bağlantının iki ucu ve günü zaten doldurulmuş gelir.',
  'help.guide.change-transit-route.step.4':
    '“Ara”ya tıklayın, başka bir bağlantıyı açın ve “Güne ekle”ye tıklayın; eskisinin yerini alır. Rezervasyonun alt kısmının en sağındaki “Düzenle” ise bunun yerine normal ulaşım formunu açar; orada Rezervasyon Kodunu, yolcuları, notları ve dosyaları düzenleyebilirsiniz.',
  'help.guide.change-transit-route.result':
    'Yolculuk artık yeni güzergâhı kullanır ve “Ulaşım” sekmesindeki kartı yeni hatları ve saatleri gösterir.',
  'help.guide.change-transit-route.tip.1':
    'Rotayı değiştirmeden bağlantıyı yeniden adlandırmak için rezervasyonun başlığındaki ada tıklayın. Notlarını “Düzenle” ile açılan ulaşım formuna yazarsınız.',
  'help.guide.change-transit-route.tip.2':
    'Rezervasyonun altındaki çöp kutusu, onaydan sonra bağlantıyı siler. Günün durakları kalır.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Bir etabın nasıl gidileceğini değiştirin',
  'help.guide.leg-travel-mode.goal':
    'Araba sürülen bir günün bir etabını yürüyüşe çevirin ya da o etabı toplu taşıma aramasıyla planlayın.',
  'help.guide.leg-travel-mode.step.1':
    'Duraklar arasındaki bağlantılar yalnızca günün rotası açıkken görünür. Açmak için günün başlığına tıklayın, sonra duraklarının altındaki çubukta “Rota”ya tıklayın.',
  'help.guide.leg-travel-mode.step.2':
    'Her bağlantı, o bölümün yolculuk süresini ve mesafesini, rotalandığı ulaşım biçiminin simgesiyle gösterir: sürüş için araba, yürüyüş için ayak, bisiklet için bisiklet.',
  'help.guide.leg-travel-mode.step.3':
    'Bölümler arasındaki bağlantı çizgisine tıkla. Menüde “Araba”, “Yürüyüş” ve “Bisiklet”, yalnızca bu bölüm için “Toplu taşıma” ve “Günün varsayılanını kullan” seçenekleri bulunur.',
  'help.guide.leg-travel-mode.step.4':
    '“Yürüyüş”ü seçin. Yalnızca bu etap değişir; günün geri kalanı kendi ulaşım türünü korur.',
  'help.guide.leg-travel-mode.result':
    'Etapta yürüyüş simgesi ve yürüme süresi görünür; günün diğer etapları günün ulaşım türünü korur.',
  'help.guide.leg-travel-mode.tip.1':
    'Mod güne değil bölüme aittir: tüm günün “Araba”, “Yürüyüş” ve “Bisiklet” düğmeleri elle ayarladığın bir bölümün üzerine asla yazmaz. “Günün varsayılanını kullan” bölümü yeniden bu düğmelere bağlar.',
  'help.guide.leg-travel-mode.tip.2':
    'Aynı menüdeki “Toplu taşıma”, tam olarak bu etap için bağlantı aramasını açar; iki uç ve kalkış saati zaten doldurulmuş gelir.',
  'help.guide.leg-travel-mode.tip.3':
    'Süreler, gerçek yollar ve yaya yolları üzerinden hesaplayan herkese açık bir rota hizmetinden gelir. Hizmet bir etabı hesaplayamazsa o etap düz çizgi olarak kalır ve süre göstermez.',
  // edit-transport
  'help.guide.edit-transport.title': 'Bir ulaşımı değiştirin ya da silin',
  'help.guide.edit-transport.goal':
    'Bir saati, perona ait bilgiyi ya da rezervasyon kodunu düzeltin veya ulaşımı seyahatten kaldırın.',
  'help.guide.edit-transport.step.1':
    'Gün planında ulaşım, duraklar arasında türüne göre renklendirilmiş bir satırdır. Rezervasyonunu açmak için satıra tıklayın. En üstte etiket olarak durum, tür, günler ve Rezervasyon Kodu (kopyalama düğmesiyle birlikte) görünür; altında kalkış ve varış saatleri, havalimanları ya da istasyonlarıyla yer alır.',
  'help.guide.edit-transport.step.2':
    'Rezervasyonun altındaki “Düzenle”, onu oluşturan formu açar; başlığın üstünde “Ulaşımı düzenle” yazar. Burada her şeyi değiştirebilirsiniz: başlığı, durum ve tür rozetlerini, rotayı, günleri ve saatleri, “Rezervasyon Kodu”nu.',
  'help.guide.edit-transport.step.3':
    'Bir uçuşun rotası havalimanlarından, trenin rotası istasyonlardan, bir gemi turunun rotası limanlardan oluşan bir zincirdir. Durak ekle (gemi turunda Liman ekle) araya bir tane daha ekler. Her bölüm kendi saatlerini ve kendi uçuş ya da tren numarasını korur.',
  'help.guide.edit-transport.step.4':
    '“Güncelle”ye tıklayın. Ulaşımı tamamen kaldırmak için aynı çubuğun solundaki çöp kutusunu, rezervasyonunun altındaki çöp kutusunu ya da “Ulaşım” sekmesindeki kartında bulunan çöp kutusunu kullanın ve onaylayın.',
  'help.guide.edit-transport.result':
    'Değişiklik ulaşımın göründüğü her yerde görünür: “Ulaşım” sekmesinde, çalıştığı günde ve haritadaki çizgisinde.',
  'help.guide.edit-transport.tip.1':
    'Aynı form iki yerden açılır: gün planındaki bir satırdan açılan rezervasyondaki “Düzenle” ile ve “Ulaşım” sekmesindeki kartın kalemiyle. Planlanmış bir toplu taşıma bağlantısı da rezervasyon olarak açılır; oradaki “Rotayı değiştir” aramayı yeniden açar, “Düzenle” ise bu formu açar.',
  'help.guide.edit-transport.tip.2':
    'Bir ulaşımı başka güne taşımak için forma gerek yoktur: satırını bir gün kartından diğerine sürükleyin.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Bir ulaşımı haritada gösterin',
  'help.guide.transport-on-map.goal': 'Bir uçuşun, sürüşün ya da bağlantının gerçek güzergâhını görün.',
  'help.guide.transport-on-map.step.1':
    'İki ucu da ayarlanmış bir ulaşımın gün planındaki satırında küçük bir rota simgesi bulunur. Tıklayın; ipucu “Rezervasyon rotalarını gizle” olarak değişir.',
  'help.guide.transport-on-map.step.2':
    'Rota haritaya çizilir; her iki ucunda ulaşımın simgesini gösteren hap biçiminde bir işaretçi bulunur.',
  'help.guide.transport-on-map.step.3':
    'Bir uç işaretçisine tıklayın; rezervasyon haritanın üzerinde açılır. Başlığında durum, tür, günler ve “Rezervasyon Kodu” görünür. Altında havalimanları ya da istasyonlarıyla birlikte saatler, havayolu ve uçuş numarası yer alır. Kapatmak için başlığındaki “Kapat”a tıklayın.',
  'help.guide.transport-on-map.step.4':
    'Günlerin üstündeki araç çubuğundaki rota simgesi tüm seyahat için tek seferde çalışır: “Tüm rezervasyon rotalarını göster” ve bunları yeniden gizlemek için “Tüm rezervasyon rotalarını gizle”.',
  'help.guide.transport-on-map.step.5':
    'Planlanmış bir toplu taşıma bağlantısının kendi rota simgesi yoktur. Günün “Rota” anahtarıyla çizilir, bu yüzden o günün rotası hâlâ açıkken “Tüm rezervasyon rotalarını gizle” bu bağlantıyı gizlemez.',
  'help.guide.transport-on-map.result':
    'Rotalar, her iki ucunda bir işaretle haritada gösterilir ve siz kapatana kadar orada kalır.',
  'help.guide.transport-on-map.tip.1':
    'Uçuş, gemi turu ve feribot eğri olarak çizilir. Araba, otobüs, taksi ve bisiklet gerçek yolları izler. Tren ya da planlanmış bir bağlantı, durduğu istasyonlardan geçer.',
  'help.guide.transport-on-map.tip.2':
    'Onaylanmış rezervasyon düz çizgiyle, beklemedeki rezervasyon kesik çizgiyle gösterilir. “Rezervasyon rota etiketleri” ayarı uç işaretçilerde havalimanı kodunu ya da istasyon adını gösterir.',
  'help.guide.transport-on-map.tip.3':
    '“Tüm rezervasyon rotalarını göster” var olan rotalara ekleme yapmaz: tek tek simgelerle ayarladıklarınızı sıfırlar. Bastıktan sonra tüm rotalar ya gösterilir ya da gizlenir.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail’den uçuşları içe aktarın',
  'help.guide.airtrail-import.goal':
    'AirTrail’de zaten kayıtlı uçuşlarınızı seyahate tek seferde aktarın ve sonrasında AirTrail’den güncel tutun.',
  'help.guide.airtrail-import.step.1':
    "AirTrail eklentisi açıksa ve örneğiniz Ayarlar'daki Entegrasyonlar altında bağlıysa, “Ulaşım” sekmesinin çubuğunda “Ulaşım” düğmesinin önünde uçak simgeli “AirTrail'den içe aktar” düğmesi görünür. Ona tıklayın.",
  'help.guide.airtrail-import.step.2':
    "“AirTrail'den içe aktar”, hesabınızdaki uçuşları iki grupta listeler. “Bu gezi sırasında”, seyahatin tarihleri içindeki uçuşları içerir ve bunlar önceden işaretlidir. “Diğer uçuşlar” kalanları içerir ve bunlar işaretli değildir. Seyahatte zaten bulunan bir uçuş gri görünür ve “İçe aktarıldı” etiketi taşır.",
  'help.guide.airtrail-import.step.3':
    'Her satır, havayolu ve uçuş numarası, iki havalimanı ve tarihle bir onay kutusudur. Uçuşu dahil etmek ya da hariç tutmak için satıra tıklayın. “Diğer uçuşlar” altındaki uçuşlar yalnızca siz işaretlerseniz içe aktarılır.',
  'help.guide.airtrail-import.step.4':
    'Aktarmalı uçuşlar birlikte gruplanır: her biri, aynı gün içinde bir öncekinin indiği havalimanından kalkar. Alttaki “O havalimanında aktarmalı tek uçuş olarak içe aktar” kutusu zaten işaretlidir. Aktarmalı tek bir rezervasyon için işaretli bırakın; etapları ayrı uçuşlar olarak içe aktarmak için kapatın.',
  'help.guide.airtrail-import.step.5':
    'Sağ alttaki, işaretli uçuş sayısını gösteren düğmeye tıklayın, örneğin “İçe aktar 2”. Sonrasındaki mesaj kaç uçuşun içe aktarıldığını söyler.',
  'help.guide.airtrail-import.step.6':
    'Uçuşlar “Onaylandı” altında kart olarak, her birinin başlığının yanında mavi bir AirTrail rozetiyle, ayrıca gittikleri günlerde satır olarak görünür. Aktarmalı uçuş tek bir karttır ve rotası aktarma noktasından geçer.',
  'help.guide.airtrail-import.result':
    'AirTrail’den gelen uçuşlar “Ulaşım” sekmesinde kart, kendi günlerinde satır olarak görünür; her birinde nereden geldiğini gösteren AirTrail rozeti bulunur.',
  'help.guide.airtrail-import.tip.1':
    'Seyahatte aynı numara ve tarihle zaten bulunan bir uçuş atlanır ve bir mesaj kaç uçuşun atlandığını bildirir. Günlerin üstündeki araç çubuğunda bulunan geri al oku, içe aktarmanın tamamını geri alır.',
  'help.guide.airtrail-import.tip.2':
    "Verilerin ana kaynağı AirTrail'dir. TREK, değişiklikleri seyahati açtığınızda ve arka planda birkaç dakikada bir okur. AirTrail'de silinen bir uçuşun TREK'teki kartı kalır ve etiketi “Senkronize değil” olur. TREK'te yaptığınız düzenlemeler AirTrail'e yalnızca Entegrasyonlar altında “Değişiklikleri AirTrail’e geri yaz” açıkken geri gönderilir.",
  'help.guide.airtrail-import.tip.3':
    'Birleştirilmiş bir bağlantı, eşitlenebilecek tek bir AirTrail uçuşu değildir, bu yüzden tek seferlik bir içe aktarmadır: mavi rozetini korur ve rozetin üzerine gelince bunu belirtir. Elle durak eklediğiniz eşitlenmiş bir uçuşta da aynısı olur.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Yol gezisi',
  'help.ctx.trip-roadtrip.summary':
    'Plan tek bir sürüş olarak gösterilir: aynı günler ve aynı yerler, aralarındaki sürüşle birlikte duraklar halinde bağlanır; sol sütunda bir şeritte ve haritada. Mesafeyi ve sürüş süresini, nerede yakıt almanız gerektiğini ve yol boyunca neler olduğunu gösterir.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Sol sütunun üstündeki “Gün” ve “Yol gezisi”, gün planı ile sürüş arasında geçiş yapar. Hiçbir şey kopyalanmaz ve değişmez: “Gün” planı olduğu gibi gösterir.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Panelin üstünde seyahatin toplamları yer alır: “Mesafe”, “Sürüş süresi” ve “Duraklar”. Altında sürüşü olan her gün için bir kart gelir: bir kutucukta günün numarası ve tarihi, ardından kilometre ve sürüş süresi, durak sayısı, geçilen yerler ve bir “İz” rozeti için etiketler. Rezerve ettiğin uçuş, tren veya feribot bu sırada ayrı bir kart olarak görünür.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Numaralı durak, günün asıl amacı olan bir yerdir. Yol üzerindeki bir durak (akaryakıt, şarj veya dinlenme alanı gibi) numara yerine türünün simgesini taşır ve sayılmaz. Hangisi olduğunu değiştirmek için numaraya, ne kadar kalacağını belirlemek için “Durak” rozetine tıkla; bir durağı gün içinde ya da başka bir güne taşımak için sürükle.',
  'help.ctx.trip-roadtrip.bullet.4':
    'İki durak arasında bir sürüş bandı, etabın mesafesini ve süresini gösterir. “Bu etap için yollar” için ona tıklayın ya da etabı bir ara noktadan geçirmek için haritada rotaya tıklayın.',
  'help.ctx.trip-roadtrip.bullet.5':
    "Sağ sütun Rota üzerinde olur: neyi arayacağınızı ve günü tek satırda seçin, koridorun genişliğini belirleyin, sonra Ara'ya basın. Bir sonuçtaki artı (Ekle), sonucu sürüşe gerçekten geçtiğiniz noktada ekler; bir oteldeki yatak simgesi ise bir gecelik konaklama ekler. Elle, aramanın bulamadığı bir yeri ekler. Başlığın yanındaki üç nokta bir Google Haritalar rotasını içe aktarır.",
  'help.ctx.trip-roadtrip.bullet.6':
    'Altındaki Sürüş ayarları şunları içerir: sınırlar, araba ve menzili, günlük sürüş süreleri, nelerden kaçınılacağı, çizginin nasıl çizileceği ve güncel uyarıların haritada gösterilip gösterilmeyeceği. Bu ayarlar seyahate aittir, böylece herkes aynı arabayla plan yapar.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Seyahati tek bir sürüş olarak görün',
  'help.guide.roadtrip-mode.goal': 'Planı yol gezisi kipine geçirin ve şeridin ne gösterdiğini anlayın.',
  'help.guide.roadtrip-mode.step.1':
    'Sol sütunun üstündeki “Günler” ve “Yol gezisi” anahtarında “Yol gezisi”ne tıklayın. Gün planının yerini sürüş alır ve harita, rotası olan her günü gösterir.',
  'help.guide.roadtrip-mode.step.2':
    'Rayın başındaki kart tüm seyahatin toplamını gösterir: Mesafe, Sürüş süresi ve Duraklar. Günler arasında kaydırırken yerinde kalır.',
  'help.guide.roadtrip-mode.step.3':
    'Bunun altında, sürüşü olan her gün için bir kart yer alır. Sürüşü olmayan gün gösterilmez. Kartın başlığında günün numarası ve altında tarihi görünür; ardından sürüşün mesafesi ve süresi ile o günün durak sayısı etiketlerle gösterilir.',
  'help.guide.roadtrip-mode.step.4':
    'Kartın içinde gün bir sıra olarak gösterilir: her yer için numaralı bir durak, her iki durak arasında bir sürüş bölümü ve sağ kenarda varış saati. Rezerve ettiğin uçuş, tren veya feribot bu sırada kendi kartıyla yer alır.',
  'help.guide.roadtrip-mode.step.5':
    'Bir günü daraltmak için başlığına tıkla; sonundaki ok döner. Daraltılan gün haritada da gizlenir. Yeniden göstermek için başlığa tekrar tıkla.',
  'help.guide.roadtrip-mode.result':
    'Sol sütunda sürüş, haritada sürüşün her günü görünür. “Günler” sizi değişmemiş plana hemen geri döndürür.',
  'help.guide.roadtrip-mode.tip.1':
    'Seçim her seyahat için hesabınıza kaydedilir; bu yüzden sayfayı yeniledikten sonra, başka bir tarayıcıda ya da başka bir cihazda seyahat yine yol gezisi görünümünde açılır.',
  'help.guide.roadtrip-mode.tip.2':
    'Anahtar yalnızca yönetici, yönetici panelinde Eklentiler altından Yol gezisi eklentisini açtıktan sonra görünür.',
  'help.guide.roadtrip-mode.tip.3':
    'Telefonda anahtar yoktur: eklenti, “Plan”ın yanına kendi “Yol gezisi” sekmesini ekler.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Yol üzerindeki molalar ve ne kadar kalacağınız',
  'help.guide.roadtrip-stops.goal':
    'Yol üzerindeki bir yeri güzergâh üstünde bir durak yapın ve her durağın ne kadar süreceğini belirleyin.',
  'help.guide.roadtrip-stops.step.1':
    'Şeritte bir durağın önündeki numaraya tıklayın. Etiketi “Yol üzerinde molaya dönüştür”dür ve altında durak türlerini bir sıra renkli daire olarak açar.',
  'help.guide.roadtrip-stops.step.2':
    'Bir tür seçin. Adını görmek için bir daireye gelin: Konaklama, Yakıt, Şarj, Dinlenme alanı, Kamp alanı, Yemek ya da Gezilecek yerler. Numara o türün simgesine dönüşür ve altındaki duraklar yeniden numaralanır.',
  'help.guide.roadtrip-stops.step.3':
    'Yol üzerindeki bir mola varış noktası değildir; bu yüzden günün başlığı bir durak eksik sayar.',
  'help.guide.roadtrip-stops.step.4':
    'Durağa numarasını yeniden vermek için simgeye tekrar tıklayın, “Mola türünü değiştir”, ve “Yeniden varış noktası yap” seçeneğini seçin.',
  'help.guide.roadtrip-stops.step.5':
    'Her durakta bir “Durak” rozeti bulunur; hiçbir şey planlanmamışken rozette artı işareti görünür. “Bu duraktaki süre”yi açmak için rozete tıkla.',
  'help.guide.roadtrip-stops.step.6':
    'Süreyi kaydırıcıyla, eksi ve artı düğmeleriyle ya da hazır değerlerden biriyle ayarlayın. “Kalkış” değişir, “Varış” ise sürüşün vardığı saatte kalır. Sonra “Kaydet” düğmesine tıklayın.',
  'help.guide.roadtrip-stops.result':
    'Değiştirdiğiniz durağın kalış süresi rozeti yeni süreyi gösterir ve ondan sonraki her varış saati buna göre kayar. Bir türe çevirip geri aldığınız durak yeniden numaralı bir varış noktasıdır.',
  'help.guide.roadtrip-stops.tip.1':
    'Kalış süresi bir ziyarete değil yere bağlıdır: iki güne planlanan bir yerde her iki günde de aynı kalış süresi geçerlidir.',
  'help.guide.roadtrip-stops.tip.2':
    'Yol üzerindeki molalar “Günler” altında da görünür. “Sürüş ayarları”ndaki “Hizmet durakları” altında “Günler içinde de göster”i kapatırsanız yalnızca “Yol gezisi”nde kalırlar.',
  'help.guide.roadtrip-stops.tip.3': 'Aynı penceredeki “Mola yok” süreyi yeniden kaldırır.',
  'help.guide.roadtrip-stops.tip.4':
    'Kartını haritanın üzerinde açmak için yol üzerindeki bir molaya ya da rezerve edilmiş bir geceye tıklayın. “Yol gezisi” açıkken oradaki “Düzenle”, yer formu yerine aramanın kullandığı kompakt pencereyi açar; o penceredeki “Daha fazla ayrıntı” ise tam formu açar.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Rota boyunca yakıt, yemek ve konaklama yeri bulun',
  'help.guide.roadtrip-corridor.goal': 'Gerçekten sürdüğünüz yol boyunca arayın ve bulduklarınızı doğru etaba ekleyin.',
  'help.guide.roadtrip-corridor.step.1':
    '“Aranan” altında listeyi açın ve ihtiyacınız olanı işaretleyin. “Yakıt”, “Şarj”, “Dinlenme alanı”, “Kamp alanı”, “Konaklama”, “Yemek” ve “Gezilecek yerler” birlikte seçilebilir: liste ikinci bir seçim için açık kalır ve alan her tür için bir simge gösterir.',
  'help.guide.roadtrip-corridor.step.2':
    'Günü aynı satırın sonundaki açılır listeden seçin. Liste, şeridin kart gösterdiği günleri sunar; “Ara” seçtiğiniz günün rotası hesaplanana kadar bekler.',
  'help.guide.roadtrip-corridor.step.3':
    '“Mesafe” altında yolun iki yanında ne kadar uzağa bakılacağını seçin: 2 km, 5 km ya da 10 km. Sonra “Ara”ya tıklayın.',
  'help.guide.roadtrip-corridor.step.4':
    'Sonuçlar türe göre gruplanır ve geçeceğiniz sırayla dizilir. Her sonuç rotadan ne kadar uzakta olduğunu ve günün sürüşünün ne kadar içinde yer aldığını gösterir.',
  'help.guide.roadtrip-corridor.step.5':
    "Sonuçtaki artı olan Ekle'ye tıklayın. Mola olarak ekle, hangi güne ve hangi sıraya ekleneceğini söyler; ayrıca Mola türü ve Bu duraktaki süre'yi sorar. Şarj istasyonunda Müsaitlik ve tarifeler de görünür. Ekle yeri sürüşe koyar, Daha fazla ayrıntı ise bunun yerine tam yer formunu açar.",
  'help.guide.roadtrip-corridor.result':
    'Eklediğiniz durak, geçtiğiniz noktada türünün simgesiyle rotada görünür. Gün bu durak üzerinden yeniden rotalanır ve liste temizlenir: sonraki durak için yeniden arayın.',
  'help.guide.roadtrip-corridor.tip.1':
    '“Ara”ya basana kadar hiçbir şey aranmaz: tek bir arama ortak bir hizmete çok sayıda istek gönderir.',
  'help.guide.roadtrip-corridor.tip.2':
    '“Ada göre süz” yeni arama yapmadan sonuçları filtreler, “Sonuçları temizle” listeyi boşaltır ve iğnelerini kaldırır. Haritada görmek için bir sonuca tıklayın.',
  'help.guide.roadtrip-corridor.tip.3':
    'Bir sonucu haritadan rotanın üzerine de sürükleyebilirsiniz. Aynı yoldan iki kez geçtiğinizde etabı böyle kendiniz seçersiniz. “Ara”nın yanındaki “Elle”, aramanın bulamadığı bir yeri adıyla arayarak ekler.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Bir etabı ara noktadan geçirin',
  'help.guide.roadtrip-via.goal': 'Bir etabın istediğiniz yolu kullanmasını sağlayın, ona durak eklemeden.',
  'help.guide.roadtrip-via.step.1':
    'İstediğiniz etabı haritada gösterin: şeritte bir durağa tıklayın, sonra haritanın üzerinde açılan kartı kapatın.',
  'help.guide.roadtrip-via.step.2':
    'Çizili rotaya tıklayın. Tıkladığınız etaba bir ara nokta eklenir ve etap onun üzerinden yeniden rotalanır.',
  'help.guide.roadtrip-via.step.3':
    'Şerit güncellenir: günün başlığı yeni mesafeyi ve sürüş süresini gösterir, ara noktadan sonraki her varış saati de onunla birlikte değişir.',
  'help.guide.roadtrip-via.step.4':
    'Tutamacın üzerine gelin, ne işe yaradığı yazar: rotayı yeniden şekillendirmek için sürükleyin, kaldırmak için sağ tıklayın. Başka bir yere sürüklerseniz etap yeni noktadan geçecek şekilde yeniden çizilir.',
  'help.guide.roadtrip-via.step.5': 'Tutamacı kaldırmak için sağ tıklayın. Etap yeniden doğrudan rotayı kullanır.',
  'help.guide.roadtrip-via.result':
    'Etap seçtiğiniz yolu izler ve günün mesafesi, sürüş süresi ile varış saatleri yeniden hesaplanır.',
  'help.guide.roadtrip-via.tip.1':
    'Ara nokta bir durak değildir: numarası, kalış süresi ve varış saati yoktur ve günün duraklarına sayılmaz.',
  'help.guide.roadtrip-via.tip.2':
    'Tutamaçlar yalnızca 9. yakınlaştırma düzeyinden itibaren görünür; bu yüzden tüm seyahati gösteren bir haritada çizgi tutamaçsız görünür.',
  'help.guide.roadtrip-via.tip.3':
    'Çizili herhangi bir etaba iki kilometreden uzak bir tıklama yok sayılır; uçuş, tren ya da feribot üzerine tıklama da öyle.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Bir etabı sürmek için başka bir yol deneyin',
  'help.guide.roadtrip-alternatives.goal':
    'Rota hizmetinin sürüşün bir bölümü için sunduğu diğer rotaları görün ve birini seçin.',
  'help.guide.roadtrip-alternatives.step.1':
    'Kenar çubuğunda bir sürüş bandına, yani iki durak arasındaki etabın mesafesini ve süresini gösteren satıra tıklayın. Etiketi “Başka yollar”dır.',
  'help.guide.roadtrip-alternatives.step.2':
    '“Bu etap için yollar” haritanın üzerinde açılır ve her yol için uzunluğuyla bir kayıt içerir. Harita her yolu sürüş süresiyle çizer: şu anki yolunuz koyu mavi, diğerleri daha açık mavi.',
  'help.guide.roadtrip-alternatives.step.3':
    'O yolu vurgulamak için bir girdinin üzerine gelin. “Mevcut” kullandığınız yoldur, “En hızlı” en kısa sürenindir; diğerleri ne kadar daha yavaş olduklarını ya da hangi yol sınıfından kaçındıklarını gösterir.',
  'help.guide.roadtrip-alternatives.step.4':
    'Bu yolu kullanmak için bir girdiye ya da mevcut yolda kalmak için “Kapat”a tıklayın.',
  'help.guide.roadtrip-alternatives.result':
    'Etap artık seçtiğiniz yolu kullanır; yan sütundaki mesafe ve ondan sonraki varış saatleri de değişir.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Başka bir yol seçtiğinizde TREK önce o yolu yol gezisinin rota motoruyla kontrol eder. Sonra etabı mümkün olan en az ara noktayla o yolda tutar ve etabın zaten sahip olduğu ara noktaların yerini alır. Rota motorunun izleyemediği bir yol kaydedilmez. Rota motorunun kendi yolunu seçmek ara noktaları yeniden kaldırır.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“Otoyolsuz”, “Paralı yolsuz” ve “Feribotsuz” kendi hız modeli olan ikinci bir motordan gelir, bu yüzden süreleri diğerleriyle karşılaştırılamaz.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Aracı ve sürüş sınırlarını ayarlayın',
  'help.guide.roadtrip-limits.goal':
    "TREK'e hangi araçla gittiğinizi ve ara vermeden ne kadar yol gitmek istediğinizi söyleyin.",
  'help.guide.roadtrip-limits.step.1':
    '“Sürüş ayarları” sağ sütunda aramanın altındadır. Rozetleri nelerin ayarlandığını gösterir; açmak için tıklayın.',
  'help.guide.roadtrip-limits.step.2':
    '“Sürüş” altında “Aralıksız en uzun sürüş” ve “Günlük sürüş” dakika cinsindendir. Boş alan kapalı demektir ve hiçbir şey işaretlenmez.',
  'help.guide.roadtrip-limits.step.3':
    '“Araç” altında ne kullandığınızı belirtin. “Benzin” yalnızca yakıt duraklarında, “Elektrik” yalnızca şarj duraklarında, “İkisi de” her ikisinde ikmal yapar.',
  'help.guide.roadtrip-limits.step.4':
    '“Bir depoyla menzil” veya “Şarj başına menzil” değerini kendin yaz. Ya da “Şu kadar doldur” altındaki “Araç verilerinden hesapla”yı aç: “Depo hacmi” ve “Tüketim”i ya da “Batarya”, “Tüketim” ve “Batarya yıpranması”nı alır, menzili kendisi hesaplar.',
  'help.guide.roadtrip-limits.step.5':
    'Sol sütundaki Mümkünse kaçın bir tercihtir, yasak değildir: başka yolu olmayan bir gün yine de o yolu kullanır ve başlığında bir not gösterir.',
  'help.guide.roadtrip-limits.step.6':
    "Kapat'a tıklayın. Kartın rozetleri neyin ayarlandığını gösterir; ray da bir sınırı aşan her bölümü ve her günü işaretler.",
  'help.guide.roadtrip-limits.result':
    'Kartın rozetleri nelerin ayarlandığını gösterir; bir sınırı aşan her etap ve gün için şeritte bir rozet çıkar.',
  'help.guide.roadtrip-limits.tip.1':
    'Ayarlar seyahate aittir, bu yüzden seyahatteki herkes aynı araç ve aynı sınırlarla plan yapar.',
  'help.guide.roadtrip-limits.tip.2':
    "Şu kadar doldur, bir durakta depo ya da bataryanın ne kadar dolacağını belirler, çünkü yolda kimse %100'e kadar şarj etmez. Yakıt ya da şarj durağında satırdaki pil rozetiyle bu değeri o durak için değiştirebilirsiniz.",
  'help.guide.roadtrip-limits.tip.3':
    '“Rota çizgisi” altında “Günleri birleştir”, bir günün son durağından ertesi günün ilk durağına olan sürüşü de rotaya katar. “Her güne konaklama yerinde başla ve orada bitir”, her günü o gecelere ayrılan konaklamada başlatır ve bitirir. “Her güne bir renk” her günü kendi renginde gösterir.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Sürüş gününe bir başlangıç ve bitiş verin',
  'help.guide.roadtrip-day-window.goal': 'Sürüşü seçtiğiniz saatte bitirin ve günün nerede sona ereceğini belirleyin.',
  'help.guide.roadtrip-day-window.step.1':
    "Sağ sütunda Sürüş ayarları'nı açın ve pencerenin sol sütununda Günlük yolculuk saatleri'ni bulun.",
  'help.guide.roadtrip-day-window.step.2':
    'Bir “Gün başlangıcı” ayarlayın. Tek başına hiçbir şey yapmaz: altlarındaki notta yazdığı gibi iki saat de gerekir.',
  'help.guide.roadtrip-day-window.step.3':
    'Bir “Gün bitişi” ayarlayın. Sürüş artık o saatte durur ve ertesi sabah devam eder; yan sütunda bir “Gün sonu” satırı ve bir “Yolculuğa devam et” satırı olarak görünür.',
  'help.guide.roadtrip-day-window.step.4':
    '“Günü bitir” altında bitiş saatinde yolda mola vermek için “Rota üzerinde”yi, sıradaki sürüşün o saati aşacağı bir yerden önce durmak için “Son yerde”yi seçin.',
  'help.guide.roadtrip-day-window.step.5': '“Kapat”a tıkla. “Sürüş ayarları” kartında iki saat rozet olarak görünür.',
  'help.guide.roadtrip-day-window.result':
    'Sürüş, belirlediğiniz uzunlukta yolculuk günlerine bölünür. Sığmayan kısım, son günden sonraki hesaplanmış günlerde devam eder. Günleriniz ve yerleri değişmez.',
  'help.guide.roadtrip-day-window.tip.1':
    'İki saatten birini temizlerseniz bu özellik yeniden kapanır. Bir durakta kendiniz ayarladığınız saatler her zaman önceliklidir.',
  'help.guide.roadtrip-day-window.tip.2':
    'Günlük yolculuk saatleri ayarlıyken günler her zaman birbirine bağlıdır: bir günün son durağından ertesi günün ilk durağına olan sürüş rotalanır ve hesaba katılır.',
  'help.guide.roadtrip-day-window.tip.3':
    'Her günün bitişi haritada da bir işaretçidir: gün numaralı bir ay simgesi. Günü başka bir yerde bitirmek için onu rota boyunca ya da bir yerin üzerine sürükle. Otomatik bitişi geri getirmek için sağ tıkla. Bu penceredeki “Otomatik gün sonlarını geri yükle” tüm bu değişiklikleri geri alır. Bir günü belirli bir durakta bitirmek için durağa tıkla ve kartında “Günü burada bitir”i aç.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Depo boşalmadan yakıt alın',
  'help.guide.roadtrip-refuel.goal':
    'Aracın hâlâ ulaşabildiği rota bölümünde yakıt alınacak bir yer bulun ve sürüşe ekleyin.',
  'help.guide.roadtrip-refuel.step.1':
    'Bir menzil ayarlıyken yan sütun, yakıtın ya da bataryanın bittiği etapta bir bant gösterir: “Depo burada bitiyor” ya da elektrikli araçta “Batarya burada bitiyor”. Altında bunun etabın ne kadar içinde olduğu görünür.',
  'help.guide.roadtrip-refuel.step.2':
    'Banttaki lamba simgesi düğmedir: “Yakıt bul”, elektrikli araçta “Şarj noktası bul”. O noktadan önceki yol boyunca arar ve ararken “Rota boyunca aranıyor…” yazar.',
  'help.guide.roadtrip-refuel.step.3':
    'En fazla üç istasyon gösterilir, her birinde rotaya uzaklığı ve geriye ne kadar menzilinizin kalacağı yazar.',
  'help.guide.roadtrip-refuel.step.4':
    'Bir teklifteki artı, onu yakıt molası olarak ekler. “Mola olarak ekle”, tür ve süre önceden doldurulmuş olarak açılır; “Ekle” ise molayı etapta rotanın gerçekten geçtiği noktaya yerleştirir.',
  'help.guide.roadtrip-refuel.result':
    'Durak kendi simgesiyle doğru etapta görünür ve menzil o duraktan itibaren yeniden hesaplanır. Bant deponun şimdi boşaldığı noktaya kayar; sürüşün sonuna ek mola vermeden ulaşabiliyorsanız bant kaybolur.',
  'help.guide.roadtrip-refuel.tip.1':
    'Menzil, günler boyunca son yakıt ya da şarj durağından itibaren sayılır. Hangi durakların sayılacağını araç türünüz belirler: “Benzin” yalnızca yakıt, “Elektrik” yalnızca şarj.',
  'help.guide.roadtrip-refuel.tip.2':
    'Arama, yakıtın biteceği noktadan önceki yola bakar, bir yedek bırakır ve sapmayı iki kez sayar; böylece önerdiği her yere gerçekten ulaşılabilir.',
  'help.guide.roadtrip-refuel.tip.3':
    'Sonuç yoksa yeniden arayabilirsiniz: lamba “Yeniden dene” olur, çünkü yer araması bazen zaman aşımına uğrayan ortak bir hizmettir.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Bir günü içe aktarılmış bir izi takip edecek şekilde ayarlayın',
  'help.guide.roadtrip-track.goal':
    'İçe aktardığınız GPX veya KML izini, bir günün sürüşü için manzaralı rota olarak kullanın.',
  'help.guide.roadtrip-track.step.1': 'Bir günün başlığındaki “İz” rozetine tıklayın. Pencere o günle açılır.',
  'help.guide.roadtrip-track.step.2':
    'Bir iz seçin. Her iz uzunluğunu ve bu günün rotasını izleyip izlemediğini ya da ne kadar uzakta olduğunu gösterir. En yakın iz başta gelir.',
  'help.guide.roadtrip-track.step.3':
    '“Bu izi takip et”e tıklayın. TREK, sürüşün izden en çok uzaklaştığı yerlere ara noktalar ekler ve rotayı yeniden hesaplar; bunu birkaç kez tekrarlar.',
  'help.guide.roadtrip-track.step.4':
    'Pencere, kaç ara nokta yerleştirildiğini ve sürüşün artık izi ne kadar yakından izlediğini ya da sürüşün zaten izi izlediğini söyler. Sol alttaki Ara noktaları bırak bunları kaldırır ve günü yönlendiricinin yeniden planlamasını sağlar. Pencereyi kapatmak izi korur.',
  'help.guide.roadtrip-track.result':
    'Günün sürüşü, rota motorunun seçeceği yol yerine izi takip eder. İzin adını görmek için “İz” rozetinin üzerine gelin. Ara noktalar sürüşü iz üzerinde tuttuğunda rozet ayrıca vurgulanır.',
  'help.guide.roadtrip-track.tip.1':
    "Pencere, yolu olan seyahat yerlerini listeler: Günler altındaki yer sütunundan Dosyayı içe aktar ile içe aktarılmış bir GPX ya da KML. GPX için Rotalar ya da İzler (yol geometrisi ile), KML için Yollar (LineString'ler) işaretli olmalıdır. Dosyayı içe aktar yalnızca Turlar eklentisi kapalıyken sunulur. Turlar açıkken bir GPX tur olur ve bu pencere onu listelemez. Seyahatte bir iz olmadıkça hiçbir günde rozet görünmez.",
  'help.guide.roadtrip-track.tip.2':
    'Bir izi takip etmek, günün etaplarının zaten sahip olduğu ara noktaların yerini alır; bu yüzden bir etabı elle izden sonra şekillendirin, önce değil.',
  'help.guide.dateless-trip.step.1': "Yeni Seyahat'e tıklayın ve seyahate bir ad verin.",
  'help.guide.edit-trip.tip.2':
    "Burada eklediğiniz ya da çıkardığınız seyahat arkadaşları, Güncelle'ye basmanıza gerek kalmadan hemen uygulanır.",
  'help.guide.trip-reminder.result':
    'Hatırlatma, seyahat başlamadan seçtiğiniz gün sayısı kadar önce, bildirim aldığınız kanallardan size ulaşır.',
  'help.guide.upcoming-reservations.step.1':
    'Sağ sütunda Yaklaşan rezervasyonlar bölümünü bulun. Tüm seyahatlerinizin sıradaki altı rezervasyonunu, en yakın olan en üstte olacak şekilde tarihi, saati ve türüyle listeler.',
  'help.guide.half-company-holiday.step.1': "Araç çubuğunda Şirket Tatili'ni seçin.",
  'help.guide.edit-holiday-calendar.result': 'Izgara ve açıklama her değişiklikten sonra hemen güncellenir.',
  'help.guide.person-color.result': 'Kişinin işlediği her gün artık yeni renkle görünür.',
  'help.guide.answer-fusion-request.step.1':
    "Biri sizi davet ettikten sonra Tatil'i açın. Birleştirme İsteği penceresi kendiliğinden açılır.",
  'help.guide.log-for-partner.step.1':
    'Kişiler kartında kişinin adına tıklayın. Yanındaki onay işareti, kişinin seçildiğini gösterir.',
  'help.guide.dissolve-fusion.step.1': "Ayarlar'ı açın.",
  'help.guide.country-places.step.2': 'Kartta, iğne simgeli Yer rozetine tıklayın.',
  'help.guide.search-place.tip.2':
    'Bölge zaten işaretliyse açılan pencere, bunun yerine kaldırmak isteyip istemediğinizi sorar.',
  'help.guide.tour-activity-stats.step.4':
    'Sağdaki rozetler toplamların neye dayandığını gösterir: Planlandı, seyahat planınızla sayılan turlar için; Kaydedilen, gerçek izi bağlanmış turlar için. Önünde, Günsüz ve Tarih yok ise henüz toplama katılmayan turları sayar. i simgesi kuralı açıklar.',
  'help.guide.move-to-list.step.2':
    "Yerleri burada da tutmak için Listeye çoğalt'a, bu listeden kaldırmak için Listeye taşı'ya tıklayın.",
  'help.guide.accept-list-invite.title': 'Liste davetini kabul etme',
  'help.guide.tour-collection-add-to-trip.step.3':
    "Ara noktalar altında, başlangıcı, durakları ve bitişi sırasıyla eklemek için ara noktalı kutucuğu seçin. Yalnızca kayıtlı çizgiyi eklemek için Yalnızca çizgi'yi seçin.",
  'help.guide.tour-collection-manage.step.1':
    'Bir liste açın. Kayıtlı her turun zorluk derecesi, türü, kaydedildiği seyahat, mesafesi, tırmanışı ve ara nokta sayısı görünür. Turu kimin kaydettiğini görmek için seyahat adının üzerine gelin.',
  'help.guide.entry-draft.step.1': 'Düzenleyicide sağ sütundaki Taslak anahtarını açın.',
  'help.guide.journey-map-layers.step.3':
    'Haritada içi boş bir iğneye ya da küçük bir noktaya tıklayın. Açılan kart bunun ne olduğunu söyler: planlanmış bir yer ve günü ya da Girdiyi aç düğmesi olan bir konaklama. Bu düğme sizi konaklamanın ait olduğu gün raporuna götürür.',
  'help.guide.journey-keep-route.step.3': "Rotayı sakla'ya tıklayın.",
  'help.guide.journey-day-stays.step.3':
    "İstemediğiniz bir konaklamada Ziyaret ettiğim bir yer değil'e tıklayın. Konaklama listeden kalkar.",
  'help.guide.journey-take-over-day.step.3':
    "Tüm gün için tek bir kayıt istiyorsanız Kayıtlar'ı Gün raporu'na getirin: tek kayıt, seçilen her konaklamayı saatleriyle listeler.",
  'help.guide.journey-auto-prepare.step.2': "Kaydedilen günler altında Kaydedilen günleri otomatik hazırla'yı açın.",
  'help.guide.photo-location.step.2': "Fotoğraflar altında Kayıtları fotoğraflarından konumlandır'ı açın.",
  'help.guide.link-trip.tip.3':
    'Henüz bağlı olmayan bir seyahatin gününe kayıt yazarsanız düzenleyici, doğrudan kayıtta Seyahat Bağla seçeneğini sunar.',
  'help.ctx.settings-plugins.summary':
    'Yöneticinin kurduğu eklentilere ait kendi ayarlarınız: her eklentinin sizden istediği anahtarlar ve tercihler, bir de eklentilerin adınıza yaptıklarının kaydı. Sekme yalnızca bir eklenti etkinken görünür.',
  'help.ctx.settings-about.bullet.3':
    "Ko-fi, Buy Me a Coffee ve Discord, TREK'i desteklemek ya da onu geliştiren insanlarla konuşmak için başvurabileceğiniz yerlerdir.",
  'help.guide.language-region.step.3':
    "Görüntüleme para birimi'ni ayarlayın ya da her seyahati kendi para biriminde görmek için Gezi para birimi'ni olduğu gibi bırakın. Sonra Sıcaklık Birimi, Mesafe Birimi, Saat Biçimi ve Hafta başlangıcı gününü seçin.",
  'help.guide.travel-map-prefs.step.3':
    'Haritada yerleri keşfet, yakındaki yerleri bulmak için kategori etiketini gösterir. Rezervasyon Kodlarını Bulanıklaştır, onay numaralarını üzerine gelene ya da dokunana kadar gizler. Rotayı konaklamadan optimize et, günü otelinizde başlatıp orada bitirir.',
  'help.guide.web-push-device.step.2':
    'Üstteki Bildirimler kartında Anlık bildirim sütunu, hangi olayların cihazlarınıza gönderileceğini belirler.',
  'help.guide.connect-airtrail.goal':
    "TREK'in kendi AirTrail'inizdeki uçuşları içe aktarıp senkronize etmesini sağlayın.",
  'help.guide.connect-dawarich.goal':
    "TREK'in, kendi Dawarich'inizden gerçekte nerelere gittiğinizi okumasını sağlayın.",
  'help.guide.tour-connect-wanderer.goal':
    "TREK'in kendi wanderer'ınızdaki patikaları okumasını sağlayın, böylece onları tur olarak içe aktarabilirsiniz.",
  'help.guide.tour-wanderer-watch.title': 'wanderer rotalarınız değişince haberdar olun',
  'help.guide.plugin-settings.tip.2':
    'Bildirimler altındaki bir eklenti kanalında, bu sayfayı açan bir Yapılandır düğmesi vardır.',
  'help.guide.default-user-settings.result':
    'Yeni hesaplar ve bu ayarları hiç değiştirmemiş herkes sizin seçimlerinizi görür.',
  'help.guide.own-routing-engine.goal':
    'Günleri ve yol gezilerini herkese açık sunucular yerine, kendi işlettiğiniz bir OSRM ya da Valhalla sunucusuyla yönlendirin.',
  'help.guide.admin-passkeys.tip.1':
    "TREK henüz bir alan adı belirleyemiyorsa bir uyarı bunu söyler ve APP_URL ya da Relying Party ID ayarlanana kadar passkey'ler gizli kalır.",
  'help.guide.rotate-jwt-secret.step.1':
    "Ayarlar sekmesinin en altında, Tehlikeli Bölge'de, JWT sırrını yenile satırının yanındaki Döndür'e tıklayın.",
  'help.guide.storage-backends.tip.3':
    'TREK fotoğraf önbelleklerini yeniden indirebilir, bu yüzden onları yansıtmak çoğunlukla depolama alanını boşa harcar.',
  'help.guide.admin-channels.step.3':
    'Aşağıdaki Bildirimler kartında her olay için hangi kanalların göndereceğini seçin: Yeni sürüm mevcut, Depolama kopyası hatası ve Kürek bölgesi istendi. Her anahtar anında kaydedilir.',
  'help.guide.notification-defaults.tip.1':
    'Kapalı, her kullanıcının yine de açabileceği bir varsayılandır. Engelli ise bildirimi herkes için kapatır.',
  'help.ctx.notifications.bullet.4':
    'Her bildirimin saatinin yanındaki Okundu işaretle (çift tik) ve Sil (çöp kutusu) yalnızca o bildirim için çalışır. Üstteki Tümünü okundu işaretle ve Tümünü sil ise tüm listeyi etkiler.',
  'help.guide.read-notifications.tip.2':
    'Düğmesi olmayan bir bildirim yalnızca bilgilendirme amaçlıdır. Panelde okuyun ve orada okundu olarak işaretleyin.',
  'help.guide.filter-notifications.result':
    'Liste yalnızca hâlâ okunmamış bildirimleri, en yenisi en üstte olacak şekilde gösterir.',
  'help.guide.delete-notifications.title': 'Bildirimleri silme',
  'help.guide.notification-settings.goal':
    'Hangi olayların zil simgesinin altında görüneceğini ve hangilerinin ayrıca e-posta, web kancası, ntfy ya da anlık bildirimle size ulaşacağını belirleyin.',
  'help.guide.public-link.step.4': "Bağlantı oluştur'a, sonra Kopyala'ya tıklayın ve bağlantıyı gönderin.",
  'help.guide.link-journal.step.2':
    "Günlük bağla'ya tıklayın ve Bir günlük seçin listesinden günlüklerinizden birini seçin.",
  'help.guide.dawarich-stays.title': 'Kaydedilmiş bir konaklamayı yere dönüştürün',
  'help.guide.dawarich-stays.tip.2':
    'Bir konaklamadan oluşturulmuş yeri silerseniz konaklama listeye Bekliyor olarak geri döner.',
  'help.guide.leave-stop-off-route.goal':
    'Bir durağı, rota oraya uğramadan günde tutun. Yürüyerek geçeceğiniz ya da yalnızca haritada görmek istediğiniz bir yer için kullanışlıdır.',
  'help.guide.day-route.tip.4':
    "Güne eklemek isteyip rotaya katmak istemediğiniz bir durak için menüsünden Rotanın dışında bırak'ı seçin.",
  'help.guide.move-booking-day.step.2':
    'Satırı başka bir gün kartının başlığına sürükleyin. Tek günlük bir rezervasyon tamamen o güne taşınır. Birkaç güne yayılan rezervasyonda Kalkış satırı başladığı günü, Varış satırı bittiği günü taşır.',
  'help.guide.place-image-from-file.title': 'Ekli bir fotoğrafı yerin görseli yapın',
  'help.guide.place-image-from-file.tip.2':
    'Durağa sabitlenmiş ya da rezervasyonuna eklenmiş bir fotoğraf da önerilir.',
  'help.guide.place-own-hours.step.5':
    "Güncelle'ye tıklayın. Kart artık Açılış Saatleri altında sizin girdiğiniz saatleri gösterir; üstteki Açık ya da Kapalı bilgisi de bunlara göre belirlenir.",
  'help.guide.confirm-stay-booking.step.3':
    "Üstteki Beklemede'ye tıklayın. İpucu Onaylandı olarak ayarla der ve nokta yeşile döner.",
  'help.guide.map-nearby-places.tip.4':
    'Araması başarısız olan kategoride kırmızı bir nokta belirir ve Bu alanda ara düğmesi uyarı işaretiyle kırmızıya döner. Yeniden denemek için düğmeye tıklayın.',
  'help.guide.tour-map-lines.tip.1':
    'Gün sütununda bir günü daralttığınızda o günün turları ve durakları haritada gizlenir.',
  'help.guide.car-stops.step.3':
    "Başlık alanına bir başlık yazın. Rota altında, arabayı aldığınız yeri Gönderen'de, teslim ettiğiniz yeri Nereye'de seçin. Siz yazmadan önce seyahatin kendi yerleri önerilir. Alış ve Alış saati arabayı ne zaman aldığınızı, İade ve İade saati ne zaman geri verdiğinizi belirtir.",
  'help.guide.transport-details.step.1':
    'Ulaşım sekmesinde bir karta tıklayın. Ayrıntılar sekmenin üzerinde açılır ve başlık bandı kartla aynı renktedir. Gün planındaki bir ulaşım satırı da aynı ayrıntıları açar.',
  'help.guide.export-transports-csv.tip.2':
    'Rezervasyonlar sekmesinde de aynı simge bulunur; o sekme bookings.csv ile biten kendi dosyasını yazar.',
  'help.guide.group-sort-bookings.step.2':
    "Gruplandır altında Durum, Gün, Tür ya da Gruplandırma yok'u seçin. Sekme hemen bu bölümlere göre düzenlenir.",
  'help.guide.export-bookings-csv.result':
    'Tarayıcınız, adı seyahate ve sekmeye göre verilmiş bir dosya indirir, örneğin autumn-in-japan-bookings.csv. Dosyada sekmenin gösterdiği her rezervasyon için bir satır bulunur.',
  'help.guide.arrange-packing-list.result':
    "Listeler sürüklediğiniz sırada durur; öğeler ise bunu kapatana kadar A'dan Z'ye sıralanır. TREK kendi belirlediğiniz sırayı yine de saklar.",
  'help.guide.count-packed-pieces.step.2':
    'Miktarın önünde eksi ve artı düğmeleriyle bir sayaç belirir: 0/5. Çantaya giren her parça için artıya tıklayın.',
  'help.guide.expense-receipts.step.4':
    'Deftere döndüğünüzde satırda adının yanında bir Fiş etiketi görünür; birden fazla fiş varsa sayısı parantez içinde yazar. Fişi açmak için etikete tıklayın.',
  'help.guide.final-budget.tip.3':
    'Seyahatten ayrılan biri, kendisine ya da kendisinden ödenmesi gereken para olduğu sürece Bakiyeler ve Nihai bütçe içinde bir satırda kalır.',
  'help.guide.files-sync-settings.step.2':
    "Akış çubuğu, TREK'i ve deponuzu her birinin tuttuğu belgelerle birlikte, ayrıca aralarındaki iki şeridi gösterir: Depoya giden ve Depodan gelen. Kapatmak için Depoya giden'e tıklayın. Şerit soluklaşır ve şeritlerin altındaki satırda Yalnızca gelen yazar. Yeniden açmak için bir kez daha tıklayın.",
  'help.guide.files-sync-settings.tip.4':
    "Bunların hiçbirini yalnızca seyahatin sahibi ya da bir yönetici değiştirebilir. Diğer üyeler akış çubuğunu Belgeler iki yönlü taşınır gibi bir satırla görür ama Ayarlar'ı görmez.",
  'help.guide.manage-notes.step.2':
    'Genişlet notun tamamını açar: tam metin, Web sitesi ve Dosya. Bir dosyaya tıklayarak önizleyebilirsiniz. En alttaki Düzenle doğrudan düzenleyiciye geçer; sağ üstteki çarpı notu yeniden kapatır.',
  'help.guide.note-categories.goal':
    'Grubun notlarına adı ve rengi olan kategoriler verin ve her seferinde yalnızca bir kategoriyi gösterin.',
  'help.guide.note-categories.tip.1':
    'Çöp kutusu yalnızca hiçbir notun kullanmadığı kategoriyi kaldırır. Hâlâ notların kullandığı bir kategori, o notları başka bir kategoriye taşıyana kadar listede kalır.',
  'help.guide.roadtrip-reorder.title': 'Bir durağı yeniden sıralayın ya da başka bir güne taşıyın',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK sabitlediğiniz bir saat hakkında soru sormaz: ray günü hemen yeniden hesaplar ve zamanında ulaşılamayan durakları işaretler.',
  'help.guide.roadtrip-overnight.step.3':
    'Pencerenin üstünde Konaklama bir gecelik konaklama ekler, Mola ise bir süreliğine durak yapar. Otel Konaklama ile, kamp alanı Mola ile açılır. Gece yalnızca Giriş ister ve onu boş bırakabilirsiniz.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Raydaki bir yakıt ya da şarj durağında pil rozetine tıklayın. Rozet, durağın ne kadar dolduracağını gösterir: Şu kadar doldur değerini kullandığı sürece soluk, kendi değeri olunca tam renkli görünür.',
  'help.guide.roadtrip-bookings.step.1':
    'Yolculuğu, gününe Uçuş, Tren, Feribot, Dolaşmak ya da Otobüs rezervasyonu olarak ekleyin; iki ucu da konumlandırılmış olsun. Sürüş bunu kendiliğinden hesaba katar: yol, yolculuğun kalktığı terminalde biter ve indiği yerde yeniden başlar.',
  'help.guide.roadtrip-google-import.result':
    'Rotanın durakları o günün son durağından sonra eklenir; raydaki ve haritadaki rota da bu duraklardan geçer.',
  'help.guide.roadtrip-hazards.step.3':
    'Uyarılar haritada alan olarak çizilir. Neyle ilgili olduğunu, hangi hizmetin bildirdiğini ve en son ne zaman güncellendiğini görmek için bir alana tıklayın.',
  'help.ctx.trip-tours.bullet.2':
    'En üstteki GPX veya KML içe aktar, dosyaları tur olarak getirir. Altındaki filtre düğmesi (başta Tümü, yanında tur sayısıyla) listeyi durum, kaynak, yönlendirme sınırı ve türe göre daraltır.',
  'help.guide.tour-show-list.step.2':
    "Her satır bir turdur. Renkli çubuk turun haritadaki çizgisidir. Yuvarlak kutucuk, TREK'te planlanmış bir yürüyüşün yönlendirme sınırını (T1 ile T6 arası) ya da türünün simgesini gösterir. Adın altındaki rozetler turun yer aldığı günleri, süresini, mesafesini ve yükselişini verir. Çok günlü bir turda sayılı ay simgesi kaç etap olduğunu gösterir.",
  'help.guide.tour-add-to-day.title': 'Bir turu bir güne koyun',
  'help.guide.tour-add-to-day.tip.2':
    'Seyahat son etaptan önce bitiyorsa seçenek sığan son etabı gösterir; sonraki etaplar günsüz kalır.',
  'help.guide.tour-day-times.step.3':
    "Güncelle'ye tıklayın. Satırda artık başlangıç → bitiş görünür. Hesaplanmış bir bitiş saati daha soluktur: tahmin için ≈, bir konaklamanın henüz saati yokken ≥, gece yarısını geçince +1 yazar. Nasıl hesaplandığını görmek için üzerine gelin.",
  'help.guide.tour-remove-from-day.goal': 'Bir turu silmeden planınızdan çıkarın.',
  'help.guide.tour-filter-list.goal':
    'Uzun bir listeyi aradığınız turlara daraltın: henüz planlanmamış, bir dosyadan gelen ya da tek bir türden olanlar.',
  'help.guide.tour-filter-list.result': 'Listede yalnızca filtrelediğiniz turlar kalır. Diğerleri hâlâ seyahattedir.',
  'help.guide.tour-hide-on-map.result':
    'Haritanızda yalnızca istediğiniz turlar görünür; gizlenenler listede soluk olarak kalır.',
  'help.guide.tour-import-plan-tab.result':
    'İz artık seyahatin bir turudur: listede GPX rozetli bir satır, haritada da bir çizgi olarak görünür.',
  'help.guide.tour-detail-read.title': 'Bir turu açın ve kartını okuyun',
  'help.guide.tour-detail-read.step.7': 'Kartı, üstündeki X ile ya da Escape tuşuna basarak kapatın.',
  'help.guide.tour-rename-colour.goal':
    'Bir tura kolay tanıyacağınız bir ad ve haritada rahat seçilen bir çizgi rengi verin.',
  'help.guide.tour-take-along.title': 'Bir turu telefonunuza ya da GPS cihazınıza alın',
  'help.guide.tour-take-along.tip.4':
    'Turlar sekmesinde aynı indirme düğmesi sol sütunun en üstündedir. Turda kaydedilmemiş değişiklikler varsa indirme önce kaydetmenizi ister.',
  'help.guide.tour-copy-keep.tip.1':
    'İkisi de birer kopyadır: turda sonradan yapılan değişiklikler ne kopyayı ne de koleksiyonda sakladığınız sürümü etkiler.',
  'help.guide.tour-packing-link.step.2':
    "Bağlanacak yer altında Tüm paket listesi'ni ya da listelerinden birini seçin. Her satır kaç öğe içerdiğini gösterir.",
  'help.guide.tour-files.title': 'Bir ture dosya ekleyin',
  'help.guide.tour-activity-link.title': 'Gerçekte izlediğiniz izi bağlayın',
  'help.guide.tour-activity-link.tip.2':
    'Yalnızca tur planlamak için kullanılmamış, içe aktarılmış bir izi bağlayabilirsiniz ve her izi yalnızca tek bir ture bağlayabilirsiniz.',
  'help.guide.tour-activity-compare.step.4':
    'İzin altındaki Değiştir başka bir kaydı seçer. Bağlantıyı kaldır kaydı turdan ayırır; iz, içe aktarma olarak seyahatte kalır.',
  'help.guide.tour-origin-check.step.3':
    'Turlar sekmesinde çizdiğiniz bir turda TREK ile planlandı yazar ve Oluşturulma günü görünür.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Sol ray düzenleyicidir. Hiçbir tur açık değilken Yeni tur planla seçeneğini sunar. Açık bir turda adı, türü, ara noktaları, türüne ait kartlar ve ayrıntıları görünür; en altta Vazgeç ve Kaydet bulunur.',
  'help.guide.tour-open-workspace.step.2':
    'Sol ray düzenleyicidir. Hiçbir tur açık değilken, haritada yeni bir tur başlatan Yeni tur planla seçeneğini sunar.',
  'help.guide.tour-open-workspace.tip.3':
    'Düzenleyicide kaydedilmemiş değişiklikler varken başka bir tur açmak istediğinizde önce sorulur: Değişiklikleri sil ya da düzenlemeye devam.',
  'help.guide.tour-draw-route.step.5':
    'Sonraki noktalara yürüyeceğiniz sırayla tıklayın. Her tıklama noktayı yeni bitiş olarak ekler ve iki noktadan itibaren TREK rotayı patikalar boyunca planlar.',
  'help.guide.tour-type-profile.goal':
    'Tur türünü, bisiklet turunda ayrıca profilini seçin, böylece rota doğru yolları izler.',
  'help.guide.tour-edit-points.title': 'Noktaları taşıyın, yeniden sıralayın ve kaldırın',
  'help.guide.tour-edit-points.tip.1':
    'İlk noktada Başlangıç, sonuncuda Son rozeti bulunur. Bir noktayı en üste ya da en alta taşımak onu başlangıç ya da bitiş yapar.',
  'help.guide.tour-shaping-points.step.4':
    "Bir durağı şekil noktasına çevirmek ya da geri döndürmek için satırındaki Diğer işlemler'i açın ve Şekil noktası yap ya da Durak yap'ı seçin.",
  'help.guide.tour-loop-reverse.step.2':
    'Son satırda artık Başlangıca dönüş yazar ve haritadaki rota başladığı yerde biter.',
  'help.guide.tour-leg-by-hand.step.1':
    "Bölümün başladığı noktada Diğer işlemler'i açın ve Sonraki bölümü elle çiz'i seçin.",
  'help.guide.tour-trip-places.goal': 'Seyahatte zaten planladığınız bir yeri turun durağı olarak ekleyin.',
  'help.guide.tour-trip-places.result':
    'Turda, seyahatin yerine karşılık gelen ve aynı adı taşıyan yeni bir durak olur.',
  'help.guide.tour-details-times.tip.2':
    'Yürüyüşte Detaylar bölümünde ayrıca, yürüyüş rehberlerinde anlatılan En yüksek patika zorluğu ve Rota seçimi de bulunur. Şehir yürüyüşünde Molalar yoktur; bunun yerine duraklarda geçirdiğiniz süre hesaba katılır.',
  'help.guide.tour-save.step.4':
    'Tur artık Bu seyahatin turları altında, henüz hiçbir güne atanmamış olarak listelenir.',
  'help.guide.tour-edit-saved.step.2':
    "Yeni bir turda olduğu gibi gerekeni değiştirin: noktaları taşıyın ya da ekleyin, türü değiştirin veya ayrıntıları düzenleyin. Burada örnek olarak Açıklama'yı düzenliyoruz.",
  'help.guide.tour-summary-profile.goal':
    'Turun ne kadar uzun ve dik olduğunu, rotanın hangi noktasında hangi yüksekliğe çıktığınızı görün.',
  'help.guide.tour-summary-profile.result':
    'Turun ne kadar uzun olduğunu, ne kadar tırmandığını, ne kadar sürdüğünü ve nerede dikleştiğini artık biliyorsunuz.',
  'help.guide.tour-list-manage.tip.1':
    'Her tur, birkaç güne yayılsa bile toplamlarda bir kez sayılır. Başında ≥ olan bir toplam, bazı turları içermez. Kaç tur olduğunu görmek için üzerine gelin.',
  'help.guide.tour-delete.tip.1': 'Bu işlem geri alınamaz; Geri al da silinen bir turu geri getirmez.',
  'help.guide.tour-saved-elsewhere.step.3':
    "Yine de Kaydet'e tıklarsanız bunun yerine Bu arada değişti açılır ve hiçbir şeyin üzerine yazılmaz.",
  'help.ctx.trip-tour-import.bullet.2':
    'İçe aktarma önizlemesi, hiçbir şey kaydedilmeden önce dosyalardaki her izi mesafesi, çıkışı, inişi ve noktalarıyla bir haritada gösterir. Şu olarak içe aktar altında izlerin ne olduğunu belirtirsiniz.',
  'help.guide.tour-import-gpx.step.3':
    'İçe aktarma önizlemesi açılır; henüz hiçbir şey kaydedilmemiştir. Harita tüm güzergâhı gösterir, dosyalardaki her iz de mesafesi, çıkışı, inişi ve noktalarıyla numaralı bir satır olarak listelenir. Kaydedilmiş bir izde ayrıca ne zaman yapıldığı ve ne kadar sürdüğü yazar.',
  'help.guide.tour-import-gpx.result':
    'Tur, Bu seyahatin turları içinde yer alır ve henüz hiçbir güne atanmamıştır. Tek bir tur, GPX turu olarak doğrudan haritada açılır.',
  'help.guide.tour-view-import.tip.3': "wanderer'dan gelen bir patika da aynı şekilde, wanderer turu olarak açılır.",
  'help.guide.tour-plan-from-import.tip.1': 'Vazgeç öneriyi kaldırır. Siz kaydedene kadar hiçbir şey saklanmaz.',
  'help.guide.tour-restore-recorded.step.2': "Kaydedilmiş izi geri yükle'ye tıklayın.",
  'help.guide.tour-take-over.step.2': "Başka bir geziden tur al'ı seçin.",
  'help.guide.tour-take-over.result':
    'Bir ileti turun alındığını onaylar ve tur, bir güne koymaya hazır halde düzenleyicide açılır.',
  'help.guide.tour-import-wanderer.tip.2':
    "İçe aktarma bir kopyadır: wanderer'da sonradan yapılan değişiklikler turu etkilemez. Turun Köken bölümündeki Kaynağı denetle, patikanın ne zaman değiştiğini söyler.",
  'help.ctx.trip-tour-map.bullet.3':
    'Haritanın üstündeki Yer veya adres ara, tura hiçbir şey eklemeden haritayı bir kasabaya, dağ evine ya da zirveye götürür.',
  'help.guide.tour-map-layers.result':
    'Tur kendisine uygun haritada çizilir; etiket de hangi haritanın açık olduğunu gösterir.',
  'help.guide.tour-along-search.step.3':
    'Rotaya bu mesafe içinde altında, çizgiden ne kadar uzağa bakılacağını seçin: 250 m, 500 m, 1 km ya da 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Turu, yol boyunca bulduğunuz bir manzara noktasından, dağ evinden ya da pınardan geçirin.',
  'help.guide.tour-along-add-stop.tip.3':
    'Durak eklenemeyen bir kesim (sabit hat olarak eklenmiş bir via ferrata ya da taşıma yolu, ya da elle çizilmiş bir kesim) listede soluk kalır ve nedeni yanında yazar.',
  'help.guide.tour-3d-terrain.result':
    'Turu 3B arazi üzerinde, dik kesimler renkli olarak gördünüz; planlamaya devam etmek için düz harita geri geldi.',
  'help.guide.tour-3d-flyover.step.3':
    'Mola uçuşu bulunduğu yerde durdurur, Uçuşu oynat oradan devam ettirir. Baştan başlat uçuşu başa sarıp yeniden başlatır.',
  'help.guide.tour-map-overlays.step.1':
    'Turlar sekmesinde bir kayak turu açın. Pistler baştan açıktır; anahtarı, sol alttaki Pistler, kayaklı koşu parkurları ve teleferikler etiketindeki karlı dağ simgesidir. Pistleri haritada gizlemek için simgeye tıklayın, yeniden göstermek için bir kez daha tıklayın.',
  'help.ctx.trip-tour-stages.title': 'Çok günlü turlar',
  'help.guide.tour-multi-day.goal': 'Bir rotayı, yolda olduğunuz her gün için bir etap olacak şekilde bölün.',
  'help.guide.tour-multi-day.tip.2':
    "İki etabı yeniden birleştirmek için aylı durağın menüsünden Etap sonunu kaldır'ı seçin. O durağı kaldırmak da etapları birleştirir ve bir bildirim Geri al seçeneği sunar.",
  'help.guide.tour-stages-on-days.step.3':
    "Bu günden itibaren etaplar'ı seçin: 1. etap o güne, sonraki her etap ondan sonraki güne gider. Bu gün tüm tur ise bunun yerine tüm rotayı o tek güne koyar.",
  'help.guide.tour-stages-on-days.result':
    'Her etap seyahatin kendi gününde yer alır, açtığınız etap da düzenleyicidedir.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Sağdaki Tur özeti mesafeyi, tırmanışı, tahmini yürüme ya da koşma süresini, molaları ve planlanan toplam süreyi verir; altında yükseklik profili yer alır. Düzenleyicinin altındaki Kaydet turu kaydeder.',
  'help.guide.tour-hike-plan.step.6': "Sol sütunun altındaki Kaydet'e tıklayın.",
  'help.guide.tour-hike-trail-details.step.1':
    "Yürüyüşü Bu seyahatin turları listesinden açın ve Ara noktalar kartının altındaki Parkur ayrıntıları'nı bulun. Rota boyunca göster'i açın.",
  'help.guide.tour-hike-trail-details.tip.3':
    'Karttaki hiçbir şey turu değiştirmez ve kart bağlantı gerektirir. İçe aktarılmış bir yürüyüşte aynı kart kendi görünümünde, yönlendirme sınırı olmadan gösterilir.',
  'help.guide.tour-hike-round.result':
    'Yürüyüş seçtiğiniz turu izler ve başlangıç noktasına geri döner. Haritanın altındaki Tur alındı satırında Geri al vardır; Kaydet bu turu saklar.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Satırdaki rozetler, o yolun mevcut yoldan ne kadar uzun, yüksek ya da yavaş olduğunu söyler. İstediğiniz yola tıklayın.',
  'help.guide.tour-ferrata-add.step.1':
    "Bir yürüyüş açıkken, sol alttaki harita düğmeleri arasından Via ferrata rotaları'na tıklayın. Rozet, görünümdeki via ferrata sayısını gösterir. İstenirse haritayı yakınlaştırın.",
  'help.guide.tour-ferrata-add.tip.3':
    'Via ferrata üzerindeki kesim yükseklik profilinde vurgulanır, böylece günün hangi noktasında oraya vardığınızı görebilirsiniz.',
  'help.guide.tour-run-plan.step.5': "Koşuya Tur adı altında bir ad verin ve Kaydet'e tıklayın.",
  'help.guide.tour-run-ways.step.1':
    "Koşuyu Bu seyahatin turları listesinden açın ve Ara noktalar kartının altındaki Parkur ayrıntıları'nda Rota boyunca göster'i açın.",
  'help.ctx.trip-tour-walk.bullet.1':
    'Tur türü Şehir / gezi yürüyüşü, bir turu yürüyüşe çevirir. Noktaları, Etiket, kalış süresi ve önem derecesi olan duraklardır. Yürüyüşte yürüyüş sınırı ve Molalar alanı yoktur; bunların yerine duraklardaki kalış süreleri kullanılır.',
  'help.guide.tour-walk-plan.step.2':
    "Durakları ekleyin: Nokta ekle'nin açık olduğundan emin olup her durak için haritaya tıklayın ya da seyahatte zaten bulunan bir yeri almak için Gezi yerleri'ne tıklayın.",
  'help.guide.tour-walk-plan.result':
    'Yürüyüş, duraklarını kalış süreleriyle listeler ve Tur özeti bunları toplar. Her durağa ne zaman ulaşacağınızı görmek için yürüyüşü bir güne koyun.',
  'help.guide.tour-walk-sights.tip.1': 'Eklenen yer yürüyüşün bir durağı olur, seyahatin bir yeri değil.',
  'help.guide.tour-walk-day-times.step.3':
    "Yürüyüşü Turlar sekmesinde yeniden açın. Ara noktalar'ın üstünde Saatler: günü ve başlangıç saatini gösterir. Birkaç güne planlanmış bir yürüyüşte başka bir gün seçmek için ona tıklayın.",
  'help.guide.tour-walk-google-import.goal':
    "Google Haritalar'dan paylaşılan bir yürüyüş rotasını yapıştırın ve duraklarını yürüyüş olarak yükleyin.",
  'help.guide.tour-walk-google-import.result':
    "Google Haritalar'daki duraklarla yeni bir şehir yürüyüşü, kaydedilmeye hazır halde düzenleyicide açılır.",
  'help.guide.tour-walk-check-off.tip.2': 'Gün planındaki yürüyüş satırı da sayıyı gösterir, örneğin 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'MTB profilinde aynı kart, haritacıların eklediği yerlerde parkur derecelerini (mtb:scale) gösterir. Derecesi olmayan bir yol için durum bilinmiyor demektir, kolay demek değildir.',
  'help.guide.tour-bike-profile.step.6': "Tur adı altına bir ad yazın, sonra sol rayın altındaki Kaydet'e tıklayın.",
  'help.guide.tour-bike-surfaces.goal':
    'Rotanın ne kadarının asfalt, çakıl ya da bilinmeyen zeminde olduğunu ve hangi tür yollardan geçtiğini öğrenin.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Kart, rotayı yönlendiricinin planladığı haliyle kullanır ve turda hiçbir şeyi değiştirmez. Bağlantı gerektirir; çevrimdışıyken bunu söyler, rota ise bundan etkilenmez.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    'Veride zorluk yok demek bilinmiyor demektir, kolay demek değildir. Bir derece, patikanın size uyup uymadığı hakkında bir şey söylemez.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Haritada tıkladığınız her nokta, bir öncekine pistler, teleferikler ve parkurlar boyunca bağlanır. Her noktanın altında, o bölüm çipler olarak listelenir: pistler zorluk derecesinin renginde ve dakikalarıyla görünür. Planlanamayan bir bölüm kırmızıya döner, nedenini söyler ve bir çözüm ya da Düz çiz seçeneği sunar.',
  'help.guide.tour-ski-plan.step.4':
    "Nokta ekle'nin açık olduğundan emin olun, sonra haritada başladığınız yere ve varmak istediğiniz her yere sırayla tıklayın. Pist yönlendiricisi her noktayı bir öncekine pistler, teleferikler ve parkurlar boyunca bağlar.",
  'help.guide.tour-ski-options.title': 'Pist yönlendiricisine nasıl kaydığınızı söyleyin',
  'help.guide.tour-ski-options.tip.2':
    'Teleferik kullan, Alp disiplini ve Snowboard için varsayılan olarak açık, diğer disiplinler için kapalıdır. Hariç tut ve Gerekirse teleferikle in yalnızca teleferik kullanımı açıkken görünür.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Haritadaki noktayı bir piste, parkura ya da teleferiğe yaklaştırmak için sürükleyebilirsiniz de. Bıraktığınızda bölüm yeniden planlanır.',
  'help.guide.tour-ski-summary.step.2':
    'Kayak, Liftlerde, Bekleme ve Yürüyerek her birinin süresini verir. Pistler, Pistlerde iniş ve Teleferik binişleri ise pistlerin uzunluğunu, pistlerde indiğiniz yüksekliği ve kaç teleferiğe bindiğinizi verir.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Kayak turunuzun çevresindeki pistleri, kayaklı koşu parkurlarını ve teleferikleri, bir de renklerinin ne anlama geldiğini görün.',
  'help.guide.tour-ski-import.title': 'Bir kayak izini içe aktarın ve ne olduğunu belirtin',
  'help.guide.tour-ski-import.tip.1':
    'İçe aktarılan iz, kaydedildiği gibi saklanır: TREK onu pistlerle eşleştirmez ve kartında Kayak süresi, Hesaplanmadı olarak görünür.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'Bir noktadaki Diğer işlemler kürek araçlarını içerir: sonraki bölümü suda planlama ya da elle çizme, Tekneyi buradan taşı ve Bu noktaya kilit ekle.',
  'help.guide.tour-paddle-setup.step.3':
    "Tekne altında Kano (kayak), Kano, SUP ya da Diğer'i seçin. Tekne, TREK'in önerdiği hızı belirler.",
  'help.guide.tour-paddle-setup.tip.4':
    "Sütunun altındaki Kürek çekmenin riskleri vardır satırı Suda güvenlik'i açar. İlk turunuzdan önce bir kez okuyun.",
  'help.guide.tour-paddle-water-route.step.5':
    "Elle çizilen tüm bölümleri tek seferde planlamak için Ara noktalar başlığındaki dalga simgesine, yani Elle çizilen bölümleri suda planla'ya tıklayın.",
  'help.guide.tour-paddle-portage.step.1':
    "Karaya çıktığınız durağın üzerine gelin ve üç nokta olan Diğer işlemler'e tıklayın.",
  'help.guide.tour-paddle-portage.result':
    'Kesim haritada ve ara noktalarda bir taşıma yolu olarak görünür ve Süre tahmini onu taşıma olarak sayar.',
  'help.guide.tour-paddle-lock.tip.2':
    'Bir taşıma yolu kilidin etrafından geçiyorsa kilit soluklaşır ve Etrafından taşınıyor, taşıma sayılır yazar. Bu durumda taşıma süresi hesaba katılır, kilidin dakikaları katılmaz.',
  'help.guide.tour-paddle-time.step.4':
    'Turda bir taşıma yolu varsa Taşırken satırı taşımayı sayar. Hızına tıklayıp tekneyi ne kadar hızlı taşıdığınızı yazın. Çıkış ve yeniden giriş, her taşıma yolu için dakikaları ekler.',
  'help.guide.tour-paddle-wind.step.1':
    'Kürek turunu seyahatin bir gününe koyun. Sol sütundaki Rüzgâr kartı, o gün için turun başlangıcındaki tahmini gösterir.',
  'help.guide.tour-paddle-wind.result': 'Suya indiğiniz yerde günün rüzgârını saat saat bilirsiniz.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Her engel için ne yapacağınızı seçin: Kürekle geç, Etrafından taşı, Etrafından dolaş ya da Etkilenmiyor. Sonraki sizi sıradaki açık girdiye götürür.',
  'help.guide.tour-paddle-track-marks.step.1':
    "Turlar sekmesinde sağ sütundan Tur ekle'ye tıklayın, GPX veya KML içe aktar'ı seçin ve dosyayı seçin.",
  'help.guide.tour-paddle-track-marks.tip.2':
    'Vazgeç, kaydetmediğiniz işaretleri kaldırır. Kaydedilen iz hiçbir zaman yeniden çizilmez.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK sürüş süresi hesaplamaz. Güne bir süre koymak istiyorsanız Detaylar içinde Planlandı altına bir süre girin.',
  'help.guide.tour-horse-plan.step.5':
    "Bölümler altında bir bölüm seçin. Bölümü hangi Yön'de sürdüğünüzü ve At erişimi'nin boyunca ne dediğini kontrol edin.",
  'help.guide.tour-horse-plan.tip.5':
    'Bir sürüşte hiçbir şey yönlendirilmez: çizili çizgiye tıklamak şekil noktası eklemez ve bir bölümün uçlarındaki noktalar rotanın koyduğu yerde kalır.',
  'help.guide.tour-horse-gap.tip.1':
    'Elle çizilen bölümü ne bir yönlendirici ne de bir at rotası denetledi. Gerçekte nereden geçtiğini görmek için haritaya bakın.',
  'help.guide.tour-horse-recorded.step.4':
    'Sürüş sol sütunda açılır. Kaydedilmiş at gezisi kartında Kaydedildiği gibi, Sürüş süresi yok ve Erişim denetlenmedi görünür. Nedenini okumak için bir rozetin üzerine gelin.',
  'help.guide.dateless-trip.step.2':
    'Başlangıç Tarihi ve Bitiş Tarihi alanlarını boş bırakın. Altlarında bir Gün sayısı alanı belirir: kaç gün planlamak istediğinizi girin.',
  'help.guide.trip-reminder.tip.1':
    'Hatırlatıcı bloğunu yalnızca seyahatin sahibi (ya da bir yönetici) görür. Blok soluksa önce bir yöneticinin Yönetici, Bildirimler bölümünden seyahat hatırlatıcılarını açması gerekir.',
  'help.guide.upcoming-reservations.step.2': 'Bir rezervasyona tıklarsanız ait olduğu seyahat açılır.',
  'help.guide.timezones-widget.tip.1':
    'Liste, Europe/Lisbon ya da America/New_York gibi resmi saat dilimi adlarını kullanır. Bu yüzden adın içinde geçen şehri arayın.',
  'help.guide.half-company-holiday.step.2': "Aynı araç çubuğunda Yarım gün'ü açın.",
  'help.guide.edit-holiday-calendar.tip.1': 'Her değişiklik anında kaydedilir. Kaydet düğmesi yoktur.',
  'help.guide.person-color.tip.1': 'Aynı renk, kişiyi araç çubuğunda ve Hakediş kartında da işaretler.',
  'help.guide.answer-fusion-request.step.2':
    'Birleştirmenin ne anlama geldiğini okuyun: tek ortak takvim, birbiriniz adına düzenleyebileceğiniz kayıtlar ve ortak tatil ayarları.',
  'help.guide.log-for-partner.step.2': 'Araç çubuğuna bakın: ilk düğme artık kişinin adını ve rengini gösterir.',
  'help.guide.dissolve-fusion.step.2': "En alttaki Birleşmeyi Kaldır bölümünde Ayır'a tıklayın.",
  'help.guide.country-places.step.3':
    'Pencere, ülke için sayılan her yeri seyahate göre gruplayarak listeler. Altıdan fazla yer varsa üstteki Yer ara listeyi daraltır. O seyahati planlayıcıda açmak için bir yere ya da seyahat başlığına tıklayın.',
  'help.guide.tour-activity-stats.step.5':
    "Turları göster'e tıklayın. Tamamladığım turlar açılır: toplamlar, Türe göre dağılım ve dönemdeki her tur; günü, seyahati, mesafesi ve tırmanışıyla birlikte. Başlıktaki etiketler burada da dönemi ve türü değiştirir.",
  'help.guide.move-to-list.step.3':
    'Yerlerin gideceği listeyi seçin. Üçten fazla liste varsa üstteki arama kutusu listeleri daraltır.',
  'help.guide.accept-list-invite.goal': 'Sizinle paylaşılan bir listeye katılın ya da daveti reddedin.',
  'help.guide.tour-collection-add-to-trip.step.4':
    "İsterseniz Gezideki ad'ı değiştirin, sonra Bir geziye ekle'ye tıklayın.",
  'help.guide.tour-collection-manage.step.2': 'Yer ara alanına yazın. Turlar, yerlerle birlikte ada göre daralır.',
  'help.guide.create-journey.tip.3':
    'Bir seyahat yeni bittiyse üstteki Seyahat yeni bitti bannerındaki Journey Oluştur, o seyahat zaten seçili olarak bir journey başlatır.',
  'help.guide.entry-draft.step.2': "Kaydet'e tıklayın. Kartta artık bir Taslak rozeti görünür.",
  'help.guide.gallery-map.step.3':
    'Zaman çizelgesine döndüğünüzde sağdaki harita kaydırmanızı izler: görünen girdinin çevresinde gün renginde bir halka olur. Bir iğneye tıklarsanız zaman çizelgesi o iğnenin girdisine kayar.',
  'help.guide.journey-map-layers.tip.1':
    'Kesikli renkli çizgi, planın bir parçası olan seyahatin GPX rotasıdır. Düz çizgi ise o gün kaydedilmiş bir rotadır.',
  'help.guide.journey-keep-route.tip.1':
    'Kayıt nerede biterse çizgi de orada biter. TREK yalnızca kaydedilenleri çizer.',
  'help.guide.journey-day-stays.tip.1':
    "Bu satır yalnızca günlüğü düzenleyebilen ve kendi Dawarich'i bağlı olan kişilere, bir de karara bağlanacak bir şeyin kaldığı günlerde görünür.",
  'help.guide.journey-take-over-day.step.4':
    "Rotayı da saklamak için Günün rotasını da sakla'yı açık bırakın, sonra Al düğmesine tıklayın. Düğme kaç taslak oluşturacağını gösterir.",
  'help.guide.journey-auto-prepare.step.3':
    "Alttaki satır, konaklamalarınızın en son ne zaman alındığını ya da neden alınamadığını söyler. Dawarich'e hemen sormak için Şimdi al'a tıklayın.",
  'help.guide.photo-location.tip.1': 'Kendi belirlediğiniz yerler asla değiştirilmez.',
  'help.ctx.settings-plugins.bullet.1':
    'Eklenti ayarları: altında, sizden bilgi isteyen her eklenti için bir kart bulunur; kartta eklentinin alanları ve Kaydet düğmesi yer alır. Gizli bir alan kaydedildikten sonra bir daha gösterilmez.',
  'help.guide.dashboard-widgets.step.3':
    'Kartların altındaki Varsayılanlara sıfırla, Görünüm sekmesinin tamamını ilk ayarlarına döndürür.',
  'help.guide.web-push-device.result':
    'Kartta Bu cihaz için açık yazar. Anlık bildirim altında açtığınız olaylar TREK kapalıyken bile size ulaşır.',
  'help.guide.connect-airtrail.step.1':
    "Entegrasyonlar altında AirTrail'i bulun ve Örnek URL'sini ile bir API anahtarını girin. Anahtarı AirTrail'de Ayarlar, Güvenlik bölümünden oluşturursunuz.",
  'help.guide.connect-dawarich.step.1':
    "Entegrasyonlar altında Dawarich'i bulun ve Sunucu adresi ile Dawarich'te Hesap, API anahtarı bölümündeki API anahtarını girin.",
  'help.guide.tour-connect-wanderer.step.1':
    "Entegrasyonlar altında wanderer'ı bulun ve Örnek URL'sini ile bir API belirtecini girin. Belirteci wanderer'da Ayarlar, Hesap, API belirteçleri bölümünden oluşturursunuz; wanderer_key_ ile başlar.",
  'help.guide.tour-wanderer-watch.goal':
    "TREK'in içe aktardığınız patikalardaki değişiklikleri arka planda kontrol etmesini sağlayın.",
  'help.guide.mcp-oauth.tip.3':
    'API Belirteçleri hâlâ çalışır ama Kullanımdan kalkıyor olarak işaretlidir. Bir OAuth istemcisine geçin.',
  'help.guide.offline-conflicts.tip.2': 'Bu seçim yalnızca bu cihaz için geçerlidir.',
  'help.guide.default-user-settings.tip.1':
    "Kullanıcının Ayarlar'da yaptığı kendi seçimi her zaman önceliklidir. Bu varsayılanlar, o ayarı değiştirmemiş herkes için geçerlidir.",
  'help.guide.own-routing-engine.step.1':
    "Kullanıcı Varsayılanları'nda Harita altındaki Kendi rota motoru alanına OSRM sunucunuzun adresini girin.",
  'help.guide.admin-passkeys.tip.2':
    "Alan adını sonradan değiştirirseniz kişilerin eklediği tüm passkey'ler çalışmaz olur.",
  'help.guide.instance-keys.tip.4':
    'Amap anahtarı bir Web 服务 (web hizmeti) anahtarı olmalıdır, JS API anahtarı değil.',
  'help.guide.rotate-jwt-secret.step.2': "Uyarıyı okuyun ve Yenile ve çıkış yap'a tıklayın.",
  'help.guide.notification-defaults.tip.2':
    'Bir varsayılan yalnızca o hücreyi kendisi değiştirmemiş kişiler için geçerlidir.',
  'help.ctx.notifications.bullet.5':
    "Hangi olayları burada, hangilerini e-posta, web kancası, ntfy ya da anlık bildirimle alacağınızı Ayarlar'da Bildirimler altından seçersiniz.",
  'help.guide.read-notifications.result':
    'Bildirimin ilgili olduğu ekrandasınızdır ve zil simgesindeki sayı bir azalır.',
  'help.guide.mark-notifications-read.title': 'Bildirimleri okundu olarak işaretleme',
  'help.guide.delete-notifications.goal': 'İhtiyacınız kalmayanları kaldırarak listeyi kısa tutun.',
  'help.guide.notification-settings.step.1': 'Sağ üstteki adınıza tıklayın.',
  'help.guide.public-link.step.5': 'Bağlantı varken seçimleri değiştirebilirsiniz. Bağlantıyı sil, bağlantıyı kapatır.',
  'help.guide.link-journal.step.3':
    'Seyahatteki her kişi için Erişim yok, Okuma ya da Düzenle seçin. Herkes okuyabilir ve Hiç kimse seçenekleri hepsini tek seferde ayarlar.',
  'help.guide.collapse-columns.tip.3': 'Bölücü odaktayken onu ok tuşlarıyla da hareket ettirebilirsiniz.',
  'help.guide.edit-place.tip.3':
    'Pencerenin dışına tıklarsanız değişiklikleriniz kaybolmaz: TREK önce Değişiklikler atılsın mı? diye sorar ve Düzenlemeye devam et sizi forma geri götürür.',
  'help.guide.dawarich-stays.goal':
    "Dawarich'in seyahat sırasında kaydettiği konaklamaları, her birini kontrol ettikten sonra yer olarak ekleyin.",
  'help.guide.leave-stop-off-route.step.1':
    "Durağa sağ tıklayın ya da üç noktasına tıklayın ve Rotanın dışında bırak'ı seçin.",
  'help.guide.move-booking-day.step.3':
    'Satır artık yeni günde, kendi saatinde görünür. Saati de değiştirmeniz gerekiyorsa rezervasyonu açın.',
  'help.guide.place-image-from-file.goal':
    'Yerin dosyaları arasında zaten bulunan bir fotoğrafı, yeniden yüklemeden yerin resmi yapın.',
  'help.guide.place-image-from-file.tip.3': 'Resmi yalnızca yerleri değiştirme yetkisi olan gezginler değiştirebilir.',
  'help.guide.place-own-hours.result':
    'Kartta telefon numaranız, e-postanız ve çalışma saatleriniz görünür; resmin çevresindeki halka da sizin saatlerinize göre yeşil ya da kırmızı olur.',
  'help.guide.confirm-stay-booking.step.4':
    'Rezervasyonu sağ üstündeki X ile kapatın. Konaklamanın kartında Rezervasyon altında artık Onaylandı yazar.',
  'help.guide.tour-map-lines.title': 'Turlarınızı haritada bulun',
  'help.guide.tour-map-lines.tip.2':
    'Bir turu gizlemek yalnızca sizi etkiler ve bu seyahat için bu tarayıcıda saklanır: tur, günleri ve rengi herkes için aynı kalır. Turlar listesinin üstündeki Tümünü göster gizlenen her turu geri getirir. Telefon haritası her zaman tüm turları gösterir.',
  'help.guide.car-stops.step.4':
    "Yol üzerindeki duraklar altında, sürüşün geçtiği her yer için Durak ekle'ye tıklayıp yeri seçin; isterseniz yanına bir saat de yazın. Yeri seçilmemiş bir durak, kaydettiğinizde silinir.",
  'help.guide.transport-details.step.2':
    "Başlıktaki etiketler durumu, türü, günü ve Rezervasyon Kodu'nu gösterir. Beklemede ile Onaylandı arasında geçiş yapmak için durum etiketine tıklayın. Kod etiketindeki küçük kopyalama simgesi (Rezervasyon kodunu kopyala) kodu panonuza kopyalar.",
  'help.guide.group-sort-bookings.step.3':
    "Sırala altında Tarih, Başlık, Tür ya da Durum'u seçin. Bunların altındaki satır sırayı ters çevirir: tarihte Önce en erken ya da Önce en geç, diğerlerinde A'dan Z'ye ya da Z’den A’ya.",
  'help.guide.booking-on-map.title': 'Bir rezervasyonu haritada bulun',
  'help.guide.export-bookings-csv.tip.1':
    'Sütunlar şunlardır: Tür, Başlık, Durum, Başlangıç, Son, Gönderen, Nereye, Konum, Onay kodu ve Notlar.',
  'help.guide.arrange-packing-list.tip.1':
    "A'dan Z'ye açıkken öğeleri sürükleyemezsiniz, ama listelerin tamamını yine sürükleyebilirsiniz.",
  'help.guide.count-packed-pieces.step.3':
    'Parçaların yalnızca bir kısmı paketlendiyse sayaç vurgu renginizde olur ve onay kutusunun çerçevesi de o renkte görünür. Eksi düğmesi bir parçayı sayıdan düşürür.',
  'help.guide.expense-receipts.step.5':
    'Önizleme fişi gösterir; üstte Yeni sekmede aç ve İndir düğmeleri bulunur. Birden fazla fiş varsa ok tuşlarıyla aralarında geçersiniz, Esc önizlemeyi kapatır.',
  'help.guide.files-sync-settings.step.3':
    "Seçeneklerin geri kalanını görmek için akış çubuğunun altındaki Ayarlar'a tıklayın.",
  'help.guide.manage-notes.step.3':
    'Aynı menüdeki Sabitle, notu panelin en üstünde tutar; not kategorisinin renginde bir çerçeve alır ve başlığın yanında bir iğne görünür. Aynı menüdeki Sabitlemeyi kaldır notu normal yerine geri koyar.',
  'help.guide.note-categories.step.1':
    "Notlar kartının başlığında Yeni Not'un yanındaki çarka tıklayın. Kategorileri Yönet açılır; her kategori için bir satır vardır: rengi, adı, altı renk noktası ve bir çöp kutusu.",
  'help.guide.note-categories.tip.2':
    'Notu olmayan bir kategori yalnızca sizin tarayıcınızda tutulur. Diğer üyeler onu, ona bir not eklendiğinde görür.',
  'help.guide.roadtrip-reorder.goal':
    'Sürüşün sırasını değiştirin ya da bir durağı doğrudan rayda başka bir güne taşıyın.',
  'help.guide.roadtrip-overnight.step.4':
    'Yanındaki Konaklama bul, kopyalayabileceğiniz adı ve rezervasyon sitelerine bağlantıları gösterir: otel için trivago ya da CHECK24, kamp alanı için PiNCAMP ya da Pitchup. Yeri, tarihleri ve misafir sayısını sitede kontrol edin.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Şu kadar dolar altında 50 ile 100 arasında bir değer seçin. Düğmelerin altındaki satır, bu doluluğun sizi buradan ne kadar uzağa götüreceğini gösterir.',
  'help.guide.roadtrip-bookings.step.2':
    'Rayda yolculuk, türünün renginde bir kart olarak görünür; varış sütununda tarifesi, başlığın altında da başlangıç ve bitiş noktaları yer alır.',
  'help.guide.roadtrip-google-import.tip.1':
    "TREK duraklar arasındaki kendi rotasını hesaplar, Google'ın çizdiği yolu kopyalamaz.",
  'help.guide.roadtrip-hazards.result':
    'Harita seyahatinizin çevresindeki güncel uyarıları gösterir, rota ise değişmez.',
  'help.ctx.trip-tours.bullet.3':
    'Bir satır: renkli çubuk turun haritadaki çizgisidir, yuvarlak kutucuk yönlendirme sınırını (T1 ile T6) ya da türü gösterir, küçük bir GPX ya da wanderer rozeti içe aktarılmış turu belirtir, diğer rozetler günleri, süreyi, mesafeyi ve yükselişi verir. Sayılı ay simgesi çok günlü bir turun etap sayısını gösterir.',
  'help.guide.tour-show-list.step.3': 'Bir satıra tıklayın. Turun kartı haritanın üzerinde açılır.',
  'help.guide.tour-add-to-day.goal':
    'Bir turu ne zaman yapacağınızı planlayın, böylece tur günde ve çizgisi haritada görünsün.',
  'help.guide.tour-add-to-day.tip.3':
    'Bir turu bir güne yalnızca bir kez ekleyebilirsiniz. Turu zaten içeren bir güne bırakırsanız TREK yalnızca Bu tur o günde zaten var. mesajını gösterir.',
  'help.guide.tour-day-times.step.4':
    'Tur, günün sonraki öğesi başladıktan sonra bitiyorsa satırın altındaki bir not bunu bildirir, örneğin Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30. Hiçbir şey taşınmaz.',
  'help.guide.tour-remove-from-day.step.1':
    "Gün sütununda turun satırının üzerine gelin, Diğer seçenekler'e tıklayın ve Günden kaldır'ı seçin.",
  'help.guide.tour-filter-list.step.1':
    "GPX veya KML içe aktar'ın altındaki filtre düğmesine tıklayın. Düğme filtrelediği durumu gösterir; başta Tümü yazar ve yanında tur sayısı bulunur.",
  'help.guide.tour-hide-on-map.title': 'Bir turun çizgisini haritada gizleyin',
  'help.guide.tour-import-plan-tab.title': 'Plan sekmesinden bir iz içe aktarın',
  'help.ctx.trip-tour-detail.title': 'Tur ayrıntıları',
  'help.guide.tour-detail-read.goal':
    'Seyahatin bir tur hakkında bildiği her şeyi görün: günleri, mesafesi ve yükseklikleri, profili ve kaynağı.',
  'help.guide.tour-detail-read.tip.1':
    'Amber renkli bir dikkatli kullanın etiketi, içe aktarılan turun yükseklik ya da ölçülerinin eksik olduğunu gösterir. Çıkışını ve profilini okurken bunu aklınızda tutun.',
  'help.guide.tour-rename-colour.step.1':
    'Turun kartını açın ve adının yanındaki kaleme tıklayın. Ad bir alana dönüşür.',
  'help.guide.tour-take-along.goal':
    'Bir turun başlangıcına giden yolu alın, turun web sayfasını açın ya da rotasını GPX dosyası olarak indirin.',
  'help.guide.tour-take-along.result':
    'Başlangıca giden yol harita uygulamanızda, tüm rota da GPX dosyası olarak elinizde.',
  'help.guide.tour-copy-keep.tip.2':
    'Gün planında bir turun menüsündeki Koleksiyona kaydet aynı pencereyi açar, yani rota orada da kaydedilir.',
  'help.guide.tour-packing-link.step.3': "Bağla'ya tıklayın.",
  'help.guide.tour-files.goal':
    'Bir rezervasyonu, haritayı ya da rotanın açıklamasını ture ekleyin ve turun kartından yeniden açın.',
  'help.guide.tour-activity-link.goal': 'Kaydedilmiş bir GPX izini, planı değiştirmeden planlanmış bir ture bağlayın.',
  'help.guide.tour-activity-link.tip.3':
    'Geçen süre, izdeki ilk zaman damgasından sonuncuya kadar işler ve molaları da kapsar.',
  'help.guide.tour-activity-compare.tip.1':
    'Haritada karşılaştır yalnızca kart haritanın yanında gösterilirken kullanılabilir, telefonda kullanılamaz.',
  'help.guide.tour-origin-check.tip.1':
    'Başka bir seyahatten alınan turda, Alındığı yer altında o seyahatin ve turun adı yazar.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Bu seyahatin turları, yani sağ ray, her turu listeler; listenin üstünde filtre ve Gezinin toplamı bulunur. Bir tur açıkken en üstteki Tur özeti mesafesini, tırmanışını, süresini ve yükseklik profilini verir. En üstteki artı (Tur ekle) bir tur planlar, içe aktarır ya da başka seyahatten alır.',
  'help.guide.tour-open-workspace.step.3':
    'Sağ ray, yani Bu seyahatin turları, seyahatin her turunu listeler; listenin üstünde filtre ve Gezinin toplamı yer alır.',
  'help.guide.tour-open-workspace.result': 'Turlar sekmesi: solda düzenleyici, sağda seyahatin turları, ortada harita.',
  'help.guide.tour-draw-route.step.6':
    "Ara noktalar altında her nokta numarasıyla bir satır alır; yerin adı yüklendiğinde satırda o ad görünür. TREK çalışırken Yeni tur'un yanındaki küçük bir nokta durumunu gösterir.",
  'help.guide.tour-type-profile.step.1':
    "Tur adı altındaki Tur türü'ne tıklayın. Seçili tür, nasıl planlandığını anlatan bir satırla birlikte görünür.",
  'help.guide.tour-edit-points.goal':
    'Turun nereden geçtiğini, noktalarını haritada ya da listede taşıyarak değiştirin.',
  'help.guide.tour-edit-points.tip.2':
    'Yerin adı yüklenene kadar satırda koordinatlar görünür. Geri al ve Yinele için klavye kısayolu yoktur.',
  'help.guide.tour-shaping-points.tip.1': 'Başlangıç ve bitiş her zaman duraktır.',
  'help.guide.tour-loop-reverse.step.3': "Turun tamamını ters yönde yürümek için yanındaki Yönü ters çevir'e tıklayın.",
  'help.guide.tour-leg-by-hand.step.2':
    'Bölüm kesikli düz bir çizgi olur ve satırın altında uzunluğuyla birlikte Elle çizildi, rotalanmadı yazar.',
  'help.guide.tour-trip-places.step.1':
    "Ara noktalar altında Nokta ekle'nin yanındaki Gezi yerleri'ne tıklayın. Seyahatin yerleri altında listelenir.",
  'help.guide.tour-details-times.title': 'Ture ad verin ve süresini planlayın',
  'help.guide.tour-details-times.tip.3':
    "Detaylar'ı daraltmak için yanındaki oka tıklayın. Alanlarından birinde Kaydet'in kabul etmediği bir değer varsa bölüm kendiliğinden açılır.",
  'help.guide.tour-save.tip.1':
    "Kaydet'in yanındaki Vazgeç, onaydan sonra kaydedilmemiş değişiklikleri atar. Kaydedilmiş turu etkilemez.",
  'help.guide.tour-edit-saved.step.3':
    "Kaydet'e tıklayın. Tur kaydedildi mesajı görünür ve tur günlerini, dosyalarını ve notlarını korur.",
  'help.guide.tour-summary-profile.step.1':
    "Bu seyahatin turları'nın en üstündeki Tur özeti, düzenleyicide açık olan turun Mesafe, Toplam yükselme ve Toplam alçalma değerlerini, tahmini süresini, molaları ve planlanan toplam süreyi verir.",
  'help.guide.tour-list-manage.title': 'Seyahatin turlarını yönetin',
  'help.guide.tour-list-manage.tip.2':
    'Turu zaten içeren gün, gün menüsünde soluk görünür. Çok günlü bir turda TREK, etapların o günden mi başlayacağını yoksa turun tamamının o güne mi konacağını sorar.',
  'help.guide.tour-delete.tip.2':
    "Turu yalnızca bir günden çıkarmak için bunun yerine günün menüsündeki Günden kaldır'ı kullanın.",
  'help.guide.tour-saved-elsewhere.step.4':
    "İkisini de saklamak için Yeni tur olarak kaydet'i, diğer sürümü yüklemek için Yenisini yükle'yi, diğer sürümün yerine sizinkini yazmak için Üzerine yaz'ı seçin.",
  'help.ctx.trip-tour-import.bullet.3':
    'İçe aktarılan tur GPX turu ya da wanderer turu olarak açılır: çizgisi, Tur özeti ve yükseklik profili, içe aktarıldığı haliyle görünür. Listedeki satırında GPX içe aktarımı rozeti bulunur.',
  'help.guide.tour-import-gpx.step.4':
    'Şu olarak içe aktar altında izlerin ne olduğunu kontrol edin. Doğa yürüyüşü önceden seçilidir. Bisiklet turu ya da Koşu profilini, Kürek turu teknesini ve suyu, Kayak ve kış ise disiplini sorar.',
  'help.guide.tour-view-import.title': 'İçe aktarılan bir ize bakın',
  'help.guide.tour-view-import.result':
    'Kaydedilen izi, hiçbir şey yeniden hesaplanmadan, içe aktarıldığı haliyle görürsünüz.',
  'help.guide.tour-plan-from-import.tip.2':
    'Kartta önerinin uzun kesimlerde izden uzak olduğu yazıyorsa, bu öneriyle plan yapmadan önce o kesimleri haritada kontrol edin.',
  'help.guide.tour-restore-recorded.step.3':
    'Kaydedilmiş izi geri yükle ile onaylayın. Ara noktalar ve yönlendirilmiş çizgi kaldırılır, günler ve notlar kalır.',
  'help.guide.tour-take-over.step.3':
    'Turu bulun: Ada göre ara alanına yazın ya da listeyi Seyahat ve Tür filtreleriyle daraltın.',
  'help.guide.tour-import-wanderer.title': "wanderer'dan bir patika içe aktarın",
  'help.guide.tour-import-wanderer.tip.3':
    'Seyahatte zaten bulunan bir patika Bu seyahatte olarak işaretlenir ve Turu aç seçeneğini sunar. İçe aktarıldıktan sonra değişmiş bir patika ise eskisinin yanında Yeni sürüm olarak içe aktar seçeneğini sunar.',
  'help.ctx.trip-tour-map.bullet.4':
    'Tur boyunca, yani sol paneldeki bir kart, rotanın yakınındaki manzara noktalarını, suyu, dağ evlerini, yeme içme yerlerini ve daha fazlasını arar, bulduklarını listeler. Listeden bir yeri tura durak olarak ekleyebilirsiniz.',
  'help.guide.tour-map-layers.tip.1':
    "Seçtiğiniz harita, sayfayı yeniden yükleyene kadar açtığınız her tur için geçerli kalır. Türü bu haritayı sunmayan bir tur Harita'da açılır. Plan sekmesindeki harita ve Ayarlar'daki ayar değişmez.",
  'help.guide.tour-along-search.step.4':
    "Tur boyunca ara'ya tıklayın. TREK yalnızca arama yapar, turda hiçbir şey değişmez.",
  'help.guide.tour-along-add-stop.step.1':
    'Tur boyunca listesindeki bir yere ya da haritadaki iğnesine tıklayın. Kartı haritanın üzerinde açılır: ne olduğu, rotadan ne kadar uzakta olduğu ve turun ne kadar ilerisinde yer aldığı.',
  'help.guide.tour-3d-terrain.title': 'Bir turu 3B görün',
  'help.guide.tour-3d-terrain.tip.1':
    'Aynı satırdaki Genel bakış, görünümü kaydırdıktan sonra tüm rotayı yeniden ekrana sığdırır.',
  'help.guide.tour-3d-flyover.step.4': "Tüm turu yeniden görmek için Genel bakış'a tıklayın.",
  'help.guide.tour-map-overlays.step.2':
    "Anahtarın yanındaki, renkli noktalardan oluşan küçük kareye, yani Pist açıklaması'na tıklayın.",
  'help.ctx.trip-tour-stages.summary':
    'Çok günlü tur, yolda olduğunuz her gün için bir etap olacak şekilde etaplara bölünmüş tek bir rotadır. Burada her günün nerede biteceğini belirler, her etabın ölçülerini görür ve etapları seyahatin günlerine yerleştirirsiniz.',
  'help.guide.tour-multi-day.step.1': 'Bu seyahatin turları içinde, düzenleyicide açmak için tura tıklayın.',
  'help.guide.tour-multi-day.tip.3':
    'Bir etabın süresine molalar dahil değildir. Uyarı renginde görünen bir süre (Bir günden fazla hareket) bir günden uzundur.',
  'help.guide.tour-stages-on-days.step.4':
    'Etapları göstermek için ay simgeli ve etap sayılı Etapları göster düğmesine tıklayın.',
  'help.ctx.trip-tour-hike.title': 'Yürüyüşler ve koşular',
  'help.guide.tour-hike-plan.title': 'Belirlediğiniz zorluk sınırı içinde yürüyüş planlayın',
  'help.guide.tour-hike-plan.result':
    'Yürüyüş, Bu seyahatin turları altında mesafesi, tırmanışı ve yürüme süresiyle listelenir ve bir güne konmaya hazırdır.',
  'help.guide.tour-hike-trail-details.step.2':
    'Neyin gösterileceğini seçin: yürüyüş derecesi için SAC, Zemin ya da Yol türü. Haritadaki rota listeyle aynı renkleri kullanır.',
  'help.guide.tour-hike-round.title': 'Belirli bir uzunlukta dairesel yürüyüş bulun',
  'help.guide.tour-hike-round.tip.1':
    'Dairesel rotalar yürüyüşün En yüksek patika zorluğu sınırında kalır. Kartın içindeki T etiketi hangi sınır olduğunu gösterir.',
  'help.guide.tour-hike-compare-ways.step.4':
    "Bu yolu kullan'a tıklayın. TREK, rotanın gerçekten bu yolu izlediğini yönlendiriciyle kontrol eder.",
  'help.guide.tour-ferrata-add.step.2':
    "Haritada bir via ferrata'ya, yani kesikli çizgisine ya da işaretine tıklayın. Kartında adı, derecesi ve uzunluğu görünür.",
  'help.guide.tour-ferrata-add.tip.4':
    "Kartın üzerindeki OpenStreetMap'te görüntüle, via ferrata'nın kendi verilerini açar. Hiçbir şey yüklenemediğinde rozet amber renge döner, nedeni ipucunda yazar.",
  'help.guide.tour-run-plan.result':
    'Koşu, Bu seyahatin turları altında Koşu süresi (planlanan) ile listelenir; profili ve temposu da onunla birlikte kaydedilir.',
  'help.guide.tour-run-ways.step.2':
    'Kartın üst kısmı artık koşunun ne kadarının asfaltsız olduğunu ve üzerindeki en zor dereceli patikayı gösterir.',
  'help.ctx.trip-tour-walk.bullet.2':
    'Ara noktalar durakları sırayla listeler. Bir durağın numarasının çevresindeki halka onu Mutlaka görülmeli (düz çizgi) ya da İsteğe bağlı (kesikli çizgi) olarak işaretler, küçük bir kalkan onu Korunuyor olarak işaretler, adının altındaki etiket de ne kadar kalacağınızı gösterir.',
  'help.guide.tour-walk-plan.step.3':
    "Ara noktalar içinde bir durağın üzerine gelin, yanındaki Diğer işlemler'e tıklayın ve Durağı düzenle'yi seçin.",
  'help.guide.tour-walk-sights.title': 'Şehir yürüyüşüne gezilecek yerler ekleyin',
  'help.guide.tour-walk-sights.tip.2':
    'Rotayı değiştirdikten sonra düğmede Yeniden ara yazar, çünkü bulunan yerler rotanın eski haline aittir.',
  'help.guide.tour-walk-day-times.step.4':
    'Her durağın altında ne zaman varacağınızı ve ne kadar kalacağınızı görürsünüz. Bir yer o saatte kapalıysa ya da kalışınız sırasında kapanıyorsa bir uyarı görünür.',
  'help.guide.tour-walk-google-import.step.1':
    "Bu seyahatin turları içinde Tur ekle'ye (üstteki +) tıklayın ve Google Maps'ten yürüyüş içe aktar'ı seçin.",
  'help.guide.tour-walk-check-off.title': 'Bir yürüyüşün duraklarını gün içinde işaretleyin',
  'help.guide.tour-walk-check-off.tip.3':
    'Yürüyüşü çevrimdışıyken bir güne koyduysanız, senkronize olduktan sonra duraklarını işaretleyebilirsiniz.',
  'help.guide.tour-bike-profile.title': 'Sürüş tarzınıza uygun bir bisiklet turu planlayın',
  'help.guide.tour-bike-profile.result':
    "Bisiklet turu kaydedilir ve Bu seyahatin turları altında, profiline göre yönlendirilmiş olarak ve Tur özeti'ndeki sürüş süresiyle listelenir.",
  'help.guide.tour-bike-surfaces.step.1':
    'Sağdaki Bu seyahatin turları içinde bir bisiklet turuna tıklayıp açın. Rotası hesaplandığında Zemin ve yollar kartı Ara noktalar altında görünür.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Kartı daraltmak için başlığına tıklayın. Sayfayı yeniden yükledikten sonra da bu tarayıcıda daraltılmış kalır.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Haritacıların tırmanışları derecelendirdiği yerlerde Tırmanış zorluğu (mtb:scale:uphill) kendi satırlarıyla aşağıda yer alır.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Ara noktaların altındaki Pist rotası kartı günü Kayak, Liftlerde, Bekleme ve Yürüyerek olarak böler; ayrıca pistlerin uzunluğunu, pistlerde indiğiniz yüksekliği ve teleferik binişlerini gösterir. Sağdaki Tur özeti içindeki Kayak süresi, tüm bölümler planlandığında hepsini toplar.',
  'help.guide.tour-ski-plan.step.5':
    'Her noktanın altında bölümü çipler olarak listelenir: her pist, lift ve yürüyüş kesimi adıyla ya da türüyle, pistler zorluk derecelerinin renginde bir noktayla ve her birinin dakikasıyla görünür.',
  'help.guide.tour-ski-options.goal':
    'En zor pistleri, neyi tercih edeceğinizi, temponuzu ve hangi liftleri kullanacağınızı ayarlayın, böylece bölümler size uysun.',
  'help.guide.tour-ski-options.tip.3':
    'Tahmin edilen bağlantılardan kaçın, rotayı harita verisinin yalnızca tahmin ettiği bağlantılardan, örneğin iki pist arasındaki haritalanmamış bir kesimden uzak tutar.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Bir bölgenin pist verisi hâlâ indirilirken planlayıcı bekler ve kendiliğinden yeniden dener.',
  'help.guide.tour-ski-summary.step.3':
    'Sağdaki Tur özeti içinde Kayak süresi hepsini toplar. Yanındaki bilgi noktası nasıl hesaplandığını açıklar.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Bir Kayak ve kış turu açıkken harita pistleri kendiliğinden gösterir. Haritanın sol alt köşesindeki satırdaki karlı dağ anahtarı pistleri kapatır ve açar. İpucunda Pistler, kayaklı koşu parkurları ve teleferikler yazar.',
  'help.guide.tour-ski-import.goal':
    'Kaydedilmiş bir kayak, kayaklı koşu ya da kar ayakkabısı izini içe aktarın ve ona doğru disiplini verin.',
  'help.guide.tour-ski-import.tip.2':
    "İzi planlanmış bir tur gibi düzenlemek için Düzenlenebilir sürüm kartındaki Düzenlenebilir sürüm planla'yı kullanın. Noktaları düz çizgilerle birleştirilir.",
  'help.ctx.trip-tour-paddle.bullet.4':
    'Süre tahmini; sudaki süreyi, tekneyi taşımayı, karaya çıkış ve yeniden girişi, kilitleri ve molaları, değiştirebileceğiniz hızlara ve dakikalara göre toplar.',
  'help.guide.tour-paddle-setup.step.4':
    "Su altında Nehir ya da Göl'ü seçin. Hem tekneyi hem de su türünü seçmeden turu kaydedemezsiniz.",
  'help.guide.tour-paddle-setup.result':
    'Teknesi, suyu ve hızıyla yeni bir kürek turu hazır; haritada ilk noktayı ekleyebilirsiniz.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Su verisi eksikse TREK, sunucunun kurulumuna göre ya bölge için veriyi kendiliğinden indirir ya da bir yöneticiden ister. Bölümde o sırada Su verisi yükleniyor yazar ve veri geldiğinde, genellikle bir ile üç dakika içinde, kendiliğinden planlanır.',
  'help.guide.tour-paddle-portage.step.2':
    "Tekneyi buradan taşı'yı seçin. Sonraki noktaya kadar olan kesim, karada çizilen bir taşıma yolu olur.",
  'help.guide.tour-paddle-lock.title': 'Bir kilit ve bekleme süresi ekleyin',
  'help.guide.tour-paddle-lock.tip.3': 'Kilidi kaldır, açık kartın altında ve Diğer işlemler içinde yer alır.',
  'help.guide.tour-paddle-time.step.5':
    'Her kilidin saatleri girilene kadar tahminde Eksik yazar ve satırların altındaki bir not neyin eksik olduğunu sayar.',
  'help.guide.tour-paddle-wind.step.2':
    'Rüzgârın yönüne, Ortalama ve Hamleler değerlerine bakın. Ortalama günün en güçlü saatlik ortalamasıdır, Hamleler ise en güçlü hamledir.',
  'help.guide.tour-paddle-checklist.title': 'Engel kontrol listesini gözden geçirin',
  'help.guide.tour-paddle-checklist.tip.2':
    "Etrafından taşı bir taşıma yolunu kendiliğinden planlamaz. Taşıma yolunu haritada kurmak için Taşımayı planla'ya tıklayın.",
  'help.guide.tour-paddle-track-marks.step.2':
    "İçe aktarma önizlemesinde Şu olarak içe aktar'ı Kürek turu yapın, sonra Tekne ve Su'yu seçin. İkisini de seçmeden içe aktarma devam etmez.",
  'help.guide.tour-paddle-track-marks.tip.3':
    "Kaydedilmiş bir izde Süre tahmini'nin Su satırının kendi hızı vardır: tıklayın ve ne kadar hızlı kürek çektiğinizi yazın.",
  'help.ctx.trip-tour-horse.bullet.5':
    'Bir GPX dosyasından içe aktarılan at gezisi kaydedildiği gibi kalır; Kaydedilmiş at gezisi kartı, içe aktarmanın neleri hesaplayamadığını söyler.',
  'help.guide.tour-horse-plan.step.6':
    "Bölümü al'a tıklayın. Bölüm, Ara noktalar kartında rotanın adını taşıyan bir rozet olarak sürüşe eklenir. Daha fazla bölümü aynı şekilde ekleyin.",
  'help.guide.tour-horse-gap.title': 'At rotaları arasındaki boşluğu kapatın',
  'help.guide.tour-horse-gap.tip.2':
    'Haritada tıkladığınız noktalar sürüşe aynı şekilde, düz ve denetlenmemiş bölümler olarak eklenir.',
  'help.guide.tour-horse-recorded.result':
    'Sürüş, dosyadaki mesafesi ve yükseklikleriyle seyahatte sürdüğünüz haliyle yer alır.',
  'help.guide.dateless-trip.step.3': "Yeni Seyahat Oluştur'a tıklayın.",
  'help.guide.trip-reminder.tip.2':
    'Yeni bir seyahatte hatırlatıcı, hareketten 3 gün önce gelecek şekilde başlar. Hatırlatıcının hangi kanallardan geleceğini Ayarlar, Bildirimler bölümünden seçersiniz.',
  'help.guide.upcoming-reservations.result':
    'Seyahat açılır. Panoya döndüğünüzde widget sıradaki rezervasyonları göstermeye devam eder.',
  'help.guide.entitlement.tip.2':
    'Birleştirilmiş bir planda herkesin kendi satırı vardır ve başkalarının hakedişini de ayarlayabilirsiniz.',
  'help.guide.half-company-holiday.step.3': 'Güne tıklayın. Hücrenin yarısı amber renge döner.',
  'help.guide.school-holidays.tip.2': 'Okul Tatilleri altındaki adı görmek için bir tatildeki günün üzerine gelin.',
  'help.guide.answer-fusion-request.step.3':
    "Planları birleştirmek için Kabul Et ve Birleştir'e, kendi planınızı ayrı tutmak için Reddet'e tıklayın.",
  'help.guide.log-for-partner.step.3':
    'İşlemek istediğiniz günlere tıklayın, sonra Kişiler içinde yeniden kendi adınıza tıklayın.',
  'help.guide.dissolve-fusion.result':
    'Herkes kendi planına ve kendi kayıtlarına döner; Kişiler kartında yalnızca siz kalırsınız.',
  'help.guide.country-places.result': 'Planlayıcı, yerin ait olduğu seyahatte açılır.',
  'help.guide.tour-activity-stats.step.6':
    "Gerçekleşmeyen bir tur için satırının sonundaki yuvarlak düğmeye, yani Hariç tut'a tıklayın. Tur listede soluk kalır ve Dışarıda olarak işaretlenir. Aynı düğme, artık Yeniden say adıyla, turu yeniden sayar.",
  'help.guide.move-to-list.tip.1':
    'Etiketler tek bir listeye aittir. Bu yüzden taşınan ya da çoğaltılan bir yer yeni listede etiketsiz olur.',
  'help.guide.accept-list-invite.step.1':
    'Daveti liste rayında Davetler altında bulun. Davet bildirimine tıklayarak geldiyseniz kart sayfanın en üstündedir. Kartta listenin adı ve daveti kimin gönderdiği yazar.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Yeni tur henüz hiçbir güne atanmamıştır ve yer eklemez. Ne liste ne de özgün tur değişir.',
  'help.guide.tour-collection-manage.step.3':
    'Turun satırının sonundaki çöp kutusuna tıklayın ve Koleksiyondan çıkar ile onaylayın.',
  'help.ctx.journey-detail.bullet.7':
    'Dawarich bağlıysa gün başlığında ayrıca Kaydı al (ya da günün için kaydedilmiş rotanın mesafesi) ve Günü aktar görünür. Bekleyen konaklamaları olan bir günde bu konaklamalar, günün sonunda tek satırda toplanır.',
  'help.guide.entry-draft.tip.1':
    "Katkıda bulunanlar taslağı yine görür. Taslak'ı kapatana kadar yalnızca herkese açık bağlantı onu göstermez.",
  'help.guide.journey-map-layers.tip.2':
    'Soluk görünen bir anahtarın henüz gösterecek bir şeyi yoktur, ipucu nedenini söyler. Seçiminiz bu tarayıcıda her journey için ayrı saklanır.',
  'help.guide.journey-keep-route.tip.2':
    "Dawarich ile yeniden karşılaştırmak için daha sonra gün başlığındaki mesafeye tıklayın: Değiştir yeni sürümü alır, Rotayı kaldır günün rotasını journey'den çıkarır.",
  'help.guide.journey-day-stays.tip.2':
    'Yoğun bir günde satırın sonundaki Günü aktar, o günün tüm konaklamalarını tek seferde halleder.',
  'help.guide.journey-take-over-day.tip.1':
    'O düğmeye tıklamadan hiçbir şey kaydedilmez ve hiçbir şey iki kez kaydedilmez: günlükte zaten olan bir konaklama işaretlidir ve yeniden seçilemez.',
  'help.guide.journey-auto-prepare.tip.1':
    'Yalnızca tarihli, bağlı seyahatlerin günleri hazırlanır ve günlüğe kendiliğinden hiçbir şey eklenmez.',
  'help.guide.photo-location.result':
    'Yeri olmayan bir girdi, GPS bilgili ilk fotoğrafının çekildiği konumu alır ve haritada görünür.',
  'help.guide.contributors.tip.2':
    'Seyahatler üzerinden, bağlı bir seyahat sayesinde erişimi olan kişileri listeler. Onların erişimini burada değil, o seyahatin ayarlarında değiştirin.',
  'help.ctx.settings-plugins.bullet.2':
    'Bir eklenti kartına, onayınızdan sonra çalışan İşlemler ekleyebilir. Eklenti sizin adınıza başka bir hizmette oturum açıyorsa Bağlan ya da Bağlantıyı kes de görünür.',
  'help.guide.web-push-device.tip.1':
    'Anlık bildirim tarayıcı başına çalışır: bildirim almak istediğiniz her telefonda ve bilgisayarda bunu yeniden yapın. Bu cihaz için kapat yalnızca o cihazdaki bildirimleri durdurur.',
  'help.guide.connect-airtrail.step.2':
    "Kendinden imzalı sertifikalara izin ver yalnızca kendi ağınızdaki güvenilir bir sunucu içindir. Değişiklikleri AirTrail’e geri yaz varsayılan olarak kapalıdır, yani TREK yalnızca okur. Düzenlemelerinizi AirTrail'e geri göndermek için açın.",
  'help.guide.connect-dawarich.step.2':
    "Yeni konaklamaları otomatik olarak denetle, TREK'in kendiliğinden bakmasını sağlar. Kapalıyken TREK Dawarich'i yalnızca siz istediğinizde okur. Kendinden imzalı sertifikaya izin ver yalnızca sunucunuzun güvenmediği bir sunucu içindir.",
  'help.guide.tour-connect-wanderer.step.2':
    "Kendinden imzalı sertifikaya izin ver'i yalnızca kendi ağınızdaki bir sunucu için açın.",
  'help.guide.tour-wanderer-watch.step.1':
    "wanderer kartında Rotalarımdaki değişiklikleri denetle'yi açın. Bunun için önce kaydedilmiş bir bağlantı gerekir.",
  'help.guide.plugin-settings.title': 'Bir eklentiyi kendiniz için kurun',
  'help.guide.default-user-settings.tip.2':
    "Görüntüleme para birimi tutarları yalnızca gösterim için çevirir. Maliyetler'e girilen tutarlar olduğu gibi kalır.",
  'help.guide.own-routing-engine.step.2':
    'Ücretli yollardan, otoyollardan ya da feribotlardan kaçınan rotalar için Kendi Valhalla sunucunuz altına Valhalla adresinizi girin. Her alan, alandan çıktığınızda kaydedilir. Sonra TREK sunucusunu yeniden başlatın ve sayfayı yenileyin.',
  'help.guide.admin-passkeys.tip.3':
    "Bir kullanıcı passkey'lerinin bulunduğu cihazı kaybettiyse, Kullanıcıyı Düzenle içindeki Passkey’leri sıfırla ile passkey'leri kaldırın.",
  'help.guide.rotate-jwt-secret.result':
    'Yeni bir imzalama sırrı devreye girer ve siz de dahil her kullanıcının yeniden giriş yapması gerekir.',
  'help.guide.read-notifications.title': 'Bildirimlerinizi okuyun',
  'help.guide.filter-notifications.title': 'Tüm bildirimleri ya da yalnızca okunmamışları görün',
  'help.guide.mark-notifications-read.goal':
    'Yenilikleri gördükten sonra zil simgesindeki vurguyu ve sayıyı temizleyin.',
  'help.guide.delete-notifications.step.1':
    "Yalnızca tek bir bildirimi kaldırmak için o bildirimin saatinin yanındaki çöp kutusuna, yani Sil'e tıklayın.",
  'help.guide.notification-settings.step.2': "Menüden Ayarlar'a tıklayın.",
  'help.guide.public-link.tip.3': 'Bir seçeneğin neyi gizlediğini okumak için üzerine gelin.',
  'help.guide.link-journal.step.4':
    "Sarı notu okuyun: günlüğe ilk kez kimin erişim alacağını belirtir. Sonra Günlüğü bağla'ya tıklayın.",
  'help.guide.dawarich-stays.step.1':
    "Dawarich, Ayarlar, Entegrasyonlar'da bağlıysa yer listesinin üstünde Dawarich’ten bölümü görünür. Başlığında TREK'in en son ne zaman baktığı ve kaç konaklamanın beklediği yazar. Listeyi açmak için ona tıklayın.",
  'help.guide.leave-stop-off-route.step.2':
    'Adın yanında Rota dışı rozeti belirir. Durak günde ve haritada kalır, ama günün rotası ve bölüm süreleri onu atlar.',
  'help.guide.move-booking-day.result': 'Rezervasyon planda yeni güne taşınır, saati değişmez.',
  'help.guide.clear-day.tip.2': 'Bu menü seçeneği yalnızca üzerinde yer olan bir günde görünür.',
  'help.guide.place-image-from-file.step.1':
    "Dosya'ları arasında fotoğraf bulunan bir yeri açın. Kartın altına yakın Dosya bloğu, yerin kaç dosyası olduğunu gösterir.",
  'help.guide.place-own-hours.title': 'Bir yerin çalışma saatlerini, telefonunu ya da e-postasını düzeltin',
  'help.guide.place-own-hours.tip.1':
    "Girdiğiniz saatler TREK'in bulduğu saatlerin yerine geçer, böylece mevsimlik saatleri olan bir kafe sizin bildiğiniz saatleri gösterir.",
  'help.guide.day-panel.tip.3':
    "Takvime göre mi planlıyorsunuz? Ayarlar'da Görünüm altındaki Gün başlıklarında önce tarih'i açın: başlıkta önce tarih, altında Gün 1 ya da günün adı görünür.",
  'help.guide.confirm-stay-booking.result':
    'Otel rezervasyonu hem konaklamanın kartında hem de Rezervasyonlar sekmesinde onaylanmış olur.',
  'help.guide.tour-map-lines.goal':
    'Seyahatin turlarını haritada birbirinden ayırın, birini çizgisinden açın ve şu an ihtiyacınız olmayanları gizleyin.',
  'help.guide.tour-map-lines.tip.3':
    'Gün planında turun satırının menüsündeki Rotanın dışında bırak, günün rotasının turun başlangıcına ve bitişine gitmesini engeller. Rotaya geri ekle bunları yeniden bağlar.',
  'help.guide.car-stops.step.5':
    'Durakların sırası rotayı belirler. Bir durağın solundaki Yukarı taşı ve Aşağı taşı sırayı değiştirir, sağındaki çarpı olan Durağı kaldır ise durağı çıkarır.',
  'help.guide.transport-details.step.3':
    'Aşağıdaki kutucuklar kalkışı ve varışı, istasyonları ya da havalimanlarıyla birlikte gösterir; ayarlandıysa peron ve koltuk da görünür. Arada durakları olan bir yolculukta duraklar Rota altında listelenir. Bölüm bölüm rezerve edilen bir yolculukta her bölümün kodu Etap kodları altında yer alır. Ardından Yolcular, Notlar, Maliyetler ve Dosya gelir. Dosyalarda göster, bileti Dosya sekmesinde açar.',
  'help.guide.export-transports-csv.title': 'Ulaşımı tablo olarak dışa aktarın',
  'help.guide.group-sort-bookings.step.4':
    'Bir bölümü daraltmak için başlığına tıklayın. Yanındaki sayı içinde kaç rezervasyon olduğunu gösterir, ikinci tıklama bölümü yeniden açar.',
  'help.guide.booking-on-map.goal': 'Bir rezervasyondan planda ve haritada yerine geçin.',
  'help.guide.export-bookings-csv.tip.2':
    'Sütunlar noktalı virgülle ayrılır ve Excel dosyayı Türkçe karakterler bozulmadan açar.',
  'help.guide.arrange-packing-list.tip.2':
    "TREK A'dan Z'ye seçimini bu tarayıcıda hatırlar, böylece liste bir sonraki sefer de sıralı açılır. Bu yalnızca sizin gördüğünüzü değiştirir, başkalarının gördüğü sırayı asla.",
  'help.guide.count-packed-pieces.step.4':
    'Sayaç miktara ulaşınca öğe kendiliğinden işaretlenir ve paketlenmiş sayılır.',
  'help.guide.expense-receipts.result':
    'Fiş harcamayla birlikte kaydedilir: satırındaki etiket fişi açar, dosya ayrıca seyahatin Dosya sekmesinde de bulunur.',
  'help.guide.files-sync-settings.step.4':
    "Bir belge silindiğinde altında, diğer taraftaki kopyaya ne olacağını seçin. İki kopyayı da tut, deponun kopyasını olduğu yerde bırakır. Geri dönüşüm kutusuna taşı ise belge TREK'te silindiğinde kopyayı deponun geri dönüşüm kutusuna gönderir.",
  'help.ctx.trip-collab.bullet.7':
    'Buradaki her şey için bağlantı gerekir. Çevrimdışıyken ileti, not, bağlantı, anket ya da oy kaydedilmez ve TREK "Bunun için bağlantı gerekir. TREK yeniden çevrimiçi olunca tekrar deneyin." der. İş birliği\'ni düzenleme yetkisi olmayan üyeler her şeyi okuyabilir, ama onlar için Yeni Not, Bağlantı ekle ve Yeni Anket yoktur ve ileti kutusu soluktur.',
  'help.guide.manage-notes.step.4':
    "Düzenle, not penceresini tüm alanlar dolu olarak açar. Gerekeni değiştirin, burada İçerik altına bir satır daha ekleyin, ve Kaydet'e tıklayın.",
  'help.guide.note-categories.step.2':
    "En alttaki Yeni kategori... alanına bir ad yazıp Enter'a basın ya da yanındaki artıya tıklayın. Yeni kategori sıradaki rengi ve kendi satırını alır.",
  'help.guide.note-categories.tip.3':
    'Kartta kategori yalnızca başlıktaki renkli noktayla gösterilir. Adını görmek için noktanın üzerine gelin.',
  'help.guide.roadtrip-reorder.step.1':
    'Bir durağı satırından tutup aynı günün başka bir durağının üzerine bırakın. Durak onun yerini alır ve gün yeni sırayla yeniden yönlendirilir.',
  'help.guide.roadtrip-overnight.step.5':
    "Ekle'ye tıklayın. Konaklama bu günden sonraki güne kadar rezerve edilir ve yer, o günün konaklaması olarak sürüşe eklenir.",
  'help.guide.roadtrip-stop-fill.step.3':
    "Durak için yeniden kendi ayarınızı kullanmak üzere rozeti yeniden açın ve Kendi varsayılanımı kullan'a tıklayın.",
  'help.guide.roadtrip-bookings.step.3':
    'Giriş ya da Biniş etiketi, sürüşün sizi terminale en geç ne zaman ulaştırması gerektiğini söyler: kalkış, tarifeden o kadar erkene alınır.',
  'help.guide.roadtrip-google-import.title': "Google Haritalar'dan rota içe aktarın",
  'help.guide.roadtrip-google-import.tip.2':
    "Bağlantıda TREK'in yerleştirebileceği en az iki, en fazla 30 durak olmalıdır.",
  'help.guide.roadtrip-hazards.tip.1':
    'Uyarılar yol kapanması değildir: rota onlar yüzünden asla değişmez. Ayrıca tarihleriniz için bir tahmin değil, güncel duyurulardır.',
  'help.ctx.trip-tours.bullet.4':
    'Bir satırın üzerine gelince göz simgesi (Haritada gizle) ve yuvarlak + simgesi (Güne ekle) görünür. Bir satırı sol sütundaki bir güne sürükleyerek o güne planlayabilir ya da tıklayarak turun kartını haritanın üzerinde açabilirsiniz.',
  'help.guide.tour-show-list.step.4':
    'Kartta turun ölçüleri ve Seyahat günleri altında turun yer aldığı günler görünür. Rotanın kendisini değiştirmek için Turlar sekmesini açın ve Bu seyahatin turları altında tura tıklayın.',
  'help.guide.tour-add-to-day.step.1':
    'Listede turun üzerine gelin ve satırının sağındaki yuvarlak + simgesine (Güne ekle) tıklayın.',
  'help.guide.tour-add-to-day.tip.4':
    'Bir gün açıkken (başlığına tıklayın) turun kartı o gün için Güne Ekle seçeneğini de sunar. Günlerin üstündeki geri alma oku atamayı geri alır.',
  'help.guide.tour-day-times.tip.1': 'Girdiğiniz bir bitiş saati, hesaplanan saatin yerine geçer.',
  'help.guide.tour-remove-from-day.step.2':
    'Tur sağdaki listede kalır. Gün rozeti kaybolur ve filtre turu yeniden Planlanmamış altında sayar.',
  'help.guide.tour-filter-list.step.2':
    "Durum altında, henüz hiçbir günde olmayan turlar için Planlanmamış'ı, zaten bir günde olanlar için Planlandı'yı seçin. Her satırda kaç turun eşleştiği yazar.",
  'help.guide.tour-hide-on-map.goal': 'Şu an ihtiyacınız olmayan turları, kimse için değiştirmeden haritadan gizleyin.',
  'help.guide.tour-import-plan-tab.goal': 'Günleri planlarken bir GPX ya da KML izini tur olarak içe aktarın.',
  'help.ctx.trip-tour-detail.summary':
    'Plan sekmesinde bir tur seçtiğinizde haritanın üzerinde açılan kart: turun günleri, ölçüleri ve profili, nereden geldiği; ayrıca turu telefonunuza gönderen, kopyalayan, bir koleksiyona kaydeden ya da paket listesine bağlayan düğmeler.',
  'help.guide.tour-detail-read.step.1':
    "Sağ sütunun en üstünde Yer'den Turlar'a geçin, sonra bir tura tıklayın. Kartı haritanın üzerinde açılır. Bir gün içindeki satırı ya da haritadaki çizgisi de aynı kartı açar.",
  'help.guide.tour-detail-read.tip.2':
    'Kürek turunda yükseklik ve profil gösterilmez: noktaları kıyıda durduğu için yükseklikler yanlış olurdu.',
  'help.guide.tour-rename-colour.step.2':
    "Yeni adı yazın ve yuvarlak onay düğmesine tıklayın ya da Enter'a basın. Escape eski adı korur.",
  'help.guide.tour-take-along.step.1':
    'Turun kartını açın. Kartın altındaki Navigasyon, turun başlangıcını bir harita uygulamasında açar; birden fazla uygulama varsa önce onları listeler. Sizi rota boyunca değil, başlangıç noktasına götürür.',
  'help.guide.tour-copy-keep.title': 'Bir turu kopyalayın ya da bir koleksiyonda saklayın',
  'help.guide.tour-copy-keep.tip.3':
    'Turlar sekmesinde sol sütunun üstündeki yer imi, açık tur için aynı işi yapar. Turda kaydedilmemiş değişiklikler varsa önce turu kaydetmenizi ister.',
  'help.guide.tour-packing-link.step.4':
    'Kartta artık liste, öğelerinin kaçının paketlendiği, bir çubuk ve ilk öğeler görünür. Paketlenenlerin üstü çizilir.',
  'help.guide.tour-files.step.1':
    "Turun kartını açın ve en sondaki Dosya bölümüne inin. Bölüm başlığındaki Yükle'ye tıklayın ve bir ya da daha fazla dosya seçin.",
  'help.guide.tour-activity-link.step.1':
    "Planlanmış turun kartını açın ve Gerçek iz bölümüne inin. Gerçek iz ekle'ye tıklayın.",
  'help.guide.tour-activity-link.result': 'İz ture bağlanır ve kart planı ile yaptıklarınızı yan yana gösterir.',
  'help.guide.tour-activity-compare.tip.2':
    "Atlas'taki tur etkinlikleri, bağlı bir iz varsa planlanan değerler yerine onu sayar.",
  'help.guide.tour-origin-check.tip.2':
    "wanderer'dan gelen bir turda kaynağın yanında bir ok (wanderer’da aç) ve bölüm başlığında Kaynağı denetle bulunur. Denetim, wanderer'a patikanın içe aktarmadan beri değişip değişmediğini sorar. Yeni anlık görüntü olarak içe aktar ise yeni sürümü ayrı bir tur olarak içe aktarır. Bu tur günlerini ve notlarını korur.",
  'help.ctx.trip-tour-planner.bullet.4':
    'Nokta ekle açıkken (haritadaki etiketin adı Nokta koy) haritaya tıklamak bir nokta koyar. Bir iğneyi taşımak için sürükleyin, çizili rotaya tıklayarak oraya bir şekil noktası ekleyin ve Gezi yerleri ile seyahatin bir yerini seçin.',
  'help.guide.tour-open-workspace.step.4':
    "Sağ rayın üstündeki artı (Tur ekle), GPX veya KML içe aktar, Google Maps'ten yürüyüş içe aktar ve Başka bir geziden tur al seçeneklerini sunar. Bir tur açıkken Yeni tur planla da bulunur.",
  'help.guide.tour-draw-route.title': 'Yeni bir tur çizin',
  'help.guide.tour-draw-route.tip.1':
    "Nokta koy açıkken imleç artı biçimindedir. Nokta eklemeden haritayı sürüklemek istiyorsanız bunu kapatın. 3B'de kapalı başlar, çünkü 3B'de haritayı sürüklemek etrafa bakmak içindir.",
  'help.guide.tour-type-profile.step.2':
    'Türü listeden seçin: Doğa yürüyüşü, Şehir / gezi yürüyüşü, Koşu, Bisiklet turu, Kürek turu, At gezisi ya da Kayak ve kış. Her türün neyi planladığı yanında yazar. Tür değişince rota yeniden planlanır.',
  'help.guide.tour-edit-points.step.1':
    'Haritada numaralı bir iğneyi noktanın olması gereken yere sürükleyin. Rota yeni noktadan geçecek şekilde yeniden planlanır.',
  'help.guide.tour-edit-points.result':
    'Noktalar istediğiniz yerde ve istediğiniz sırada, rota da yeniden planlanmış olur.',
  'help.guide.tour-shaping-points.tip.2': 'Şekil noktası, çok günlü bir turun etabını bitiremez.',
  'help.guide.tour-loop-reverse.tip.1': 'Tur döngü olduktan sonra Başlangıca dön, Tur zaten başlangıca dönüyor der.',
  'help.guide.tour-leg-by-hand.step.3':
    "Bölümü yeniden yönlendiriciye planlatmak için aynı menüyü açın ve Sonraki bölümü yeniden rotala'yı seçin.",
  'help.guide.tour-trip-places.step.2':
    'Gezinin yerlerinde ara ya da Tura yakın altına bakın: rotanın iki kilometre çevresindeki yerler, en yakın olan en üstte, her biri mesafesiyle.',
  'help.guide.tour-details-times.goal': 'Ture bir ad, bir açıklama ve bir bağlantı verin; süresine molalar ekleyin.',
  'help.guide.tour-details-times.result': 'Turun artık adı, notları ve planladığınız süresi var.',
  'help.guide.tour-save.tip.2':
    'Rayın üstündeki Turlara dön düzenleyiciyi kapatır; kaydedilmemiş değişiklik varsa önce sorar.',
  'help.guide.tour-edit-saved.step.4':
    "Kapatmak için Turlara dön'e tıklayın. Kaydedilmemiş değişiklikler varsa önce Kaydedilmemiş tur değişiklikleri silinsin mi? diye sorar.",
  'help.guide.tour-summary-profile.step.2': 'Tahmini sürenin yanındaki bilgi noktası nasıl hesaplandığını açıklar.',
  'help.guide.tour-list-manage.goal':
    'Seyahatin turlarının toplamlarını görün, birini bir güne koyun ve listeyi ihtiyacınız olanlara daraltın.',
  'help.guide.tour-list-manage.tip.3':
    "Satırdaki çöp kutusu turu siler. Plan sekmesinin sağ sütunu Turlar'a geçirildiğinde aynı turlar orada da listelenir.",
  'help.guide.tour-delete.tip.3':
    'Tur burada, Turlar sekmesinde silinir. Çöp kutusu yalnızca seyahatin yerlerini düzenleyebilen gezginlere görünür.',
  'help.guide.tour-saved-elsewhere.tip.1':
    'Yeni tur olarak kaydet, kopyanıza turun adını verir ve sonuna (my version) ekler.',
  'help.ctx.trip-tour-import.bullet.4':
    'Düzenlenebilir sürüm, içe aktarılan izi taşıyabileceğiniz ara noktalı bir ture çevirir. İçe aktarımı değiştir kaydedilmiş izi korur, düzenleyicideki Kaydedilmiş iz kartı da sizi ona geri götürür.',
  'help.guide.tour-import-gpx.step.5': "1 turu içe aktar'a tıklayın (üç izli bir dosya için 3 turu içe aktar).",
  'help.guide.tour-view-import.goal':
    'İçe aktarılan bir turun güzergâhını, ölçülerini ve yüksekliğini geldiği haliyle görün.',
  'help.guide.tour-plan-from-import.title': 'İçe aktarılan izden düzenlenebilir tur planlayın',
  'help.guide.tour-plan-from-import.tip.3':
    'Kürek ya da kayak izi içe aktarıldığında noktaları yönlendirilmez, aralarına düz çizgiler çizilir.',
  'help.guide.tour-restore-recorded.tip.1':
    'Kart yalnızca İçe aktarımı değiştir ile değiştirilip kaydedilmiş turlarda görünür.',
  'help.guide.tour-take-over.step.4': 'Tura tıklayın. Sağ tarafta turun çizgisi, ölçüleri ve geldiği seyahat görünür.',
  'help.guide.tour-import-wanderer.goal': "Kendi wanderer'ınızdaki patikalardan birini seyahate tur olarak aktarın.",
  'help.guide.tour-import-wanderer.tip.4': 'wanderer’da aç, patikayı sunucunuzda açar.',
  'help.ctx.trip-tour-map.bullet.5':
    "3B'de rota araziye oturur ve ne kadar dik olduğuna göre renklenir. Derecelerini özetleyen bir açıklama ve rotayı baştan sona izleyen bir uçuş da vardır.",
  'help.guide.tour-map-layers.tip.2':
    'Yürüyüş ve Bisiklet haritaları gönüllülerin işlettiği sunuculardan gelir ve yalnızca yöneticiniz izin verdiği sürece bulunur. Biri yanıt vermeyi bırakırsa bölümünde ! görünür ve başka bir haritaya geçebilirsiniz. Turunuz olduğu gibi kalır.',
  'help.guide.tour-along-search.step.5':
    'Bulunan yerler rotaya olan uzaklıklarıyla listelenir ve haritada renklerinde çizilir. Yıldız en çok bilinenleri, Turda ise zaten durak olanları işaretler. Düğmede artık Yeniden ara yazar.',
  'help.guide.tour-along-add-stop.step.2':
    'Nereye girer, yerin en iyi uyduğu kesimi önerir. Bunun yerine hangi iki durak arasına gireceğini ya da Yeni varış noktası olarak eklenip eklenmeyeceğini seçmek için ona tıklayın. Harita, hiçbir şey değişmeden önce yeni rotayı kesikli çizgiyle gösterir.',
  'help.guide.tour-3d-terrain.goal':
    'Turu gerçek arazi üzerinde, ne kadar dik olduğuna göre renklendirilmiş olarak görün.',
  'help.guide.tour-3d-terrain.tip.2':
    "Seçtiğiniz harita 3B'de de kullanılır; via ferrata'lar, pistler ve deniz işaretleri de öyle. Bir turu düzenlerken noktalarını arazi üzerinde sürükleyebilirsiniz; Nokta koy açıkken tıklamak bir nokta ekler.",
  'help.guide.tour-3d-flyover.result': 'Turu havadan, baştan sona, seçtiğiniz hızda izlediniz.',
  'help.guide.tour-map-overlays.step.3':
    "Açıklama renklerin anlamını söyler: Acemi'den Freeride'a kadar inen pistler, Kayaklı koşu parkurları, Kış ve kar ayakkabısı yolları, Kızak yolları ile Liftler ve teleferikler. OpenSnowMap’te tam açıklama her simgeyi gösterir. Kapatmak için Escape'e basın.",
  'help.ctx.trip-tour-stages.bullet.1':
    "Düzenleyicideki Gün seçeneği, açık turu Günübirlik ya da Çok günlü yapar. Günübirlik'e geri döndüğünüzde onayınızdan sonra tüm etap sonları kaldırılır, rota olduğu gibi kalır.",
  'help.guide.tour-multi-day.step.2':
    "Gün altında Çok günlü'ye tıklayın. Bir not, ilk etap sonunun nereye konduğunu söyler.",
  'help.guide.tour-multi-day.tip.4':
    "Etaplar Kaydet'e tıkladığınızda kaydedilir. Bir değişiklik, seyahatin bir gününe konmuş bir etabı kaldırıyorsa bir bildirim, kaydetmenin etabı o günden çıkaracağını söyler.",
  'help.guide.tour-stages-on-days.step.5':
    "Her etapta bulunduğu gün görünür. Etabı başka bir güne taşımak için gününe tıklayın ya da güne atamayı kaldırmak için Gün yok'u seçin.",
  'help.ctx.trip-tour-hike.summary':
    "Turlar sekmesinde açık bir yürüyüş ya da koşu: solda düzenleyici, ortada harita, sağda turun özeti ve seyahatin diğer turları. Yürüyüş sizin izin verdiğiniz patika zorluğuna uyar, koşu kendi temponuza göre sürelendirilir; ikisi de OpenStreetMap'in yol boyunca kaydettiği bilgileri gösterir.",
  'help.guide.tour-hike-plan.goal':
    'Bir yürüyüş başlatın, duraklarını belirleyin, rotanın kullanabileceği en zor patika derecesini seçin ve kaydedin.',
  'help.guide.tour-hike-plan.tip.1':
    'Yeni bir yürüyüş T2 (Dağ yürüyüşü) ile başlar. T3 seçildiğinde, bu tür yolların uçuruma açık olabileceğini, sağlam adım ve yükseklik korkusu olmamasını gerektirdiğini belirten bir uyarı eklenir.',
  'help.guide.tour-hike-trail-details.step.3':
    'Rozetler özet verir: rotanın ne kadarının Bilinen olduğu, En yüksek bilinen derece ve ayrı olarak yürüyüşün planlandığı Rota sınırı.',
  'help.guide.tour-hike-round.goal':
    "TREK'in, bir yürüyüşün seçtiğiniz bir durağından başlayarak istediğiniz uzunlukta döngüler önermesini sağlayın.",
  'help.guide.tour-hike-round.tip.2':
    "1 ile 60 km arasındaki mesafeler kabul edilir ve girdiğiniz mesafenin %20'si içindeki döngüler önerilir.",
  'help.guide.tour-hike-compare-ways.result':
    'O tek kesim seçtiğiniz yolu izler, yürüyüşün geri kalanı olduğu gibi kalır. Haritanın altındaki Yol alındı satırında Geri al vardır.',
  'help.guide.tour-ferrata-add.step.3':
    "Tura ekle'ye tıklayın. Via ferrata, her iki ucunda bir noktayla ayrı bir bölüm olarak rotanın sonuna eklenir.",
  'help.guide.tour-run-plan.title': 'Kendi temponuzda bir koşu planlayın',
  'help.guide.tour-run-plan.tip.1': 'Tempo girilmeden koşu kaydedilemez.',
  'help.guide.tour-run-ways.step.3':
    "Zemin'e, sonra listeden bir zemine tıklayın. Haritada yalnızca o kesimler çizilir.",
  'help.ctx.trip-tour-walk.bullet.3':
    "Yürüyüş başlangıç saati olan bir güne konduğunda Ara noktalar'ın üstündeki Saatler: o günü gösterir, her durakta da varış saati, kalış süresi ve çalışma saatlerinin durumu görünür.",
  'help.guide.tour-walk-plan.step.4':
    'Durağa bir Etiket ve Kalış süresi (dakika) verin. Süreyi henüz bilmiyorsanız boş bırakın, yalnızca yanından geçtiğiniz bir nokta için 0 girin.',
  'help.guide.tour-walk-sights.goal': 'Bir tema seçin, yürüyüş boyunca arama yapın ve bir yeri durak olarak ekleyin.',
  'help.guide.tour-walk-sights.tip.3':
    "Çalışma saatleri ve web siteleri kaynaktan, çoğunlukla OpenStreetMap'ten gelir. Gitmeden önce kontrol edin.",
  'help.guide.tour-walk-day-times.tip.1':
    'Başlangıç saati yoksa satırda şu yazar: Varışları ve çalışma saatlerini görmek için yürüyüşe bu günde bir saat verin.',
  'help.guide.tour-walk-google-import.step.2':
    "Bağlantıyı Yürüyüş rotasının bağlantısı alanına yapıştırın ve Bağlantıyı oku'ya tıklayın.",
  'help.guide.tour-walk-check-off.goal':
    'Duraklara o gün ziyaret edildi ya da atlandı işareti koyun ve ne kadar yürüyüş kaldığını görün.',
  'help.guide.tour-walk-check-off.result':
    'Ziyaret edilen duraklar işaretlenir, atlananların üstü çizilir ve kalan süre yalnızca henüz önünüzde olanları sayar.',
  'help.guide.tour-bike-profile.goal':
    "Bir bisiklet turu başlatın ve TREK'in onu gezi, yol, çakıl ya da MTB için yönlendirmesini sağlayın.",
  'help.guide.tour-bike-profile.tip.1':
    'Profili sonradan değiştirirseniz tüm rota yeni profile göre yeniden planlanır.',
  'help.guide.tour-bike-surfaces.step.2':
    'Kartın başlığındaki rozet, rotanın asfaltsız olduğu bilinen kısmının payını gösterir.',
  'help.guide.tour-bike-mtb-grades.title': 'Bir dağ bisikleti turunun patika derecelerini kontrol edin',
  'help.guide.tour-bike-mtb-grades.tip.3': "Dereceler okunamadıysa kart bunu belirtir. Yeniden dene'ye tıklayın.",
  'help.ctx.trip-tour-ski.bullet.5':
    "Kayak ve kış turu açıkken harita pistleri OpenSnowMap'ten gösterir; anahtarlarının yanında Pist açıklaması bulunur. Bunların hepsi haritalanmış veridir: buradaki hiçbir şey bir pistin ya da liftin açık olup olmadığını, karın durumunu veya çığ riskini söylemez.",
  'help.guide.tour-ski-plan.step.6': "Tura Tur adı altında bir ad verin ve Kaydet'e tıklayın.",
  'help.guide.tour-ski-options.step.1':
    "Kayak ve kış turunda yönlendiricinin seçenekleri Branş altındadır. Yalnızca branşınızın kullandığı seçenekleri görürsünüz: örneğin Kayaklı koşu'da En zor pistler yoktur.",
  'help.guide.tour-ski-options.result':
    'Tur sınırlarınıza göre yeniden planlanır ve Pist rotası kartı, kaçındığı daha zor pistleri listeler.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Çevrimdışıyken bölümler şimdilik düz çizgiyle çizilir. Yaz yolları hakkındaki gri satır bir nottur, hata değildir.',
  'help.guide.tour-ski-summary.tip.1':
    'Kaçınılan, yönlendiricinin En zor pistler sınırınız yüzünden uzak durduğu daha zor pistleri listeler.',
  'help.guide.tour-ski-pistes-layer.step.2':
    "Anahtarın yanındaki, dört renkli noktalı düğmeye, yani Pist açıklaması'na tıklayın.",
  'help.guide.tour-ski-import.step.1':
    "Turlar sekmesinde Tur ekle'ye (Bu seyahatin turları'nın üstündeki artı) tıklayın, GPX veya KML içe aktar'ı seçin ve dosyayı seçin.",
  'help.guide.tour-ski-import.tip.3':
    'Aynı önizlemeyi açmak için GPX, KML ya da KMZ dosyalarını Turlar sekmesinin herhangi bir yerine de bırakabilirsiniz.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'Rüzgâr, turun planlandığı gün için turun başlangıcındaki tahmini gösterir. Kontrol listesi, kaydedilmiş rotadaki engelleri ve her biri için verdiğiniz kararı listeler.',
  'help.guide.tour-paddle-setup.step.5':
    'Gölde Göllerde rotayı belirler: Dümdüz en kısa yoldur, Kıyıya yakın ise rüzgârlı günler için kıyıya yakın kalır.',
  'help.guide.tour-paddle-water-route.title': 'Suda bölümleri planlayın',
  'help.guide.tour-paddle-water-route.tip.2':
    'Rota tekneyi bir savağın etrafından taşıyorsa ya da bir havuzdan geçiyorsa TREK orada Bulundu işaretli kendi noktasını koyar. Bu noktayı taşır ya da değiştirirseniz nokta sizin olur.',
  'help.guide.tour-paddle-portage.step.3':
    'Noktanın altında, uzunluğunu ve ek dakikaları gösteren bir Taşıma kartı belirir. Açmak için ona tıklayın.',
  'help.guide.tour-paddle-lock.goal': 'Ture bir kilit ekleyin ve bekleme ile geçiş süresini turun süresine katın.',
  'help.guide.tour-paddle-lock.result':
    'Kilit dakikalarıyla birlikte turda yer alır ve Süre tahmini bu dakikaları toplar.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK suda 4 km/s, taşırken 2 km/s ve her taşıma yolunda 10 dakika ile başlar. Bunlar ayarlayabileceğiniz başlangıç değerleridir, ölçüm değildir.',
  'help.guide.tour-paddle-wind.step.3':
    'Çubuklar günün saatlerini gösterir; hamleler ortalama rüzgârın arkasında görünür. O saatin değerlerini ve yönünü görmek için bir çubuğun üzerine gelin.',
  'help.guide.tour-paddle-checklist.goal':
    'Kaydedilmiş bir rotadaki savaklar, kilitler ve erişim kuralları hakkında bilinenleri görün ve her birinde ne yapacağınıza karar verin.',
  'help.guide.tour-paddle-checklist.tip.3':
    "Yeniden kontrol et işaretli bir girdi için karar, rota ya da veri değişmeden önce verilmişti. Yeniden karar verin ya da Kararı koru veya Kararı kaldır'ı seçin. Artık geçerli olmayan kararlar Önceki kararlar altında listelenir.",
  'help.guide.tour-paddle-track-marks.step.3': "1 turu içe aktar'a tıklayın.",
  'help.guide.tour-paddle-track-marks.result':
    'Kaydedilmiş iz taşıma yollarını ve kilitleri de içerir, Süre tahmini bunları sayar.',
  'help.guide.tour-horse-plan.title': 'At rotaları boyunca bir gezi planlayın',
  'help.guide.tour-horse-plan.step.7':
    "Sürüşe Tur adı altında bir ad verin, sonra sol sütunun altındaki Kaydet'e tıklayın.",
  'help.guide.tour-horse-gap.goal': 'Sürüşünüzün bittiği yerden uzakta başlayan bir bölümle devam edin.',
  'help.guide.tour-horse-gap.tip.3':
    'Sürüşünüzün sonuna 25 m içinde başlayan bir bölüm doğrudan sürüşten devam eder ve Geziye bağlantı satırında Gezinin sonuna bağlanır yazar.',
  'help.guide.tour-horse-recorded.tip.1':
    'Çizgi dosyada kaydedildiği gibi kalır. Hiçbir şey yeniden yönlendirilmez ve kaydedilmiş bir sürüşün düzenlenebilir sürümü yoktur.',
  'help.guide.dateless-trip.result':
    'Kartta Fikir ve Tarih ayarlanmadı yazar; seyahatte de istediğiniz sayıda boş gün olur.',
  'help.guide.trip-reminder.title': 'Seyahatten önce hatırlatıcı alın',
  'help.guide.upcoming-reservations.tip.1': 'Otel konaklaması iki kez görünür: bir kez giriş, bir kez çıkış için.',
  'help.guide.half-company-holiday.result':
    'Şirket yarım gün izinlidir ve o güne işlenen bir tatil günü yalnızca yarım gün sayılır.',
  'help.guide.edit-holiday-calendar.title': 'Bir tatil takvimini değiştirin ya da kaldırın',
  'help.guide.answer-fusion-request.result':
    "Kabul Et ve Birleştir'den sonra iki plan da tek ızgarada görünür, her kişi kendi renginde.",
  'help.guide.log-for-partner.result': 'Günler diğer kişinin renginde görünür ve sizin değil, onun hakedişinden düşer.',
  'help.guide.dissolve-fusion.tip.1':
    'O penceredeki İptal, planı olduğu gibi bırakır. Kayıtlarınız her iki durumda da korunur.',
  'help.guide.country-places.tip.1':
    'Yanlış ülkenin altında görünen bir yerin adresi ya da koordinatları genellikle yanlıştır. Seyahati buradan açın ve yeri orada düzeltin.',
  'help.guide.tour-activity-stats.title': 'Turlarda neler yaptığınızı görün',
  'help.guide.tour-activity-stats.result':
    'Penceredeki ve Turlar sekmesindeki toplamlar artık hariç tuttuğunuz turu içermez. Turun rotası, günleri ve seyahat olduğu gibi kalır.',
  'help.guide.move-to-list.tip.2':
    "Taşımak yerleri listeden çıkarır. Bu yüzden Listeye taşı'yı yalnızca listenin sahibi ya da bir yönetici görür. Listeye çoğalt, açabildiğiniz her listede çalışır.",
  'help.guide.accept-list-invite.step.2': "Katılmak için Kabul et'e, daveti reddetmek için Reddet'e tıklayın.",
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Çizgisiz saklanan bir turda ara noktalar da birlikte eklenmelidir. Pencere bunu belirtir ve o seçeneği sizin için seçer.',
  'help.guide.tour-collection-manage.tip.1':
    'Bir turu listeden kaldırmak, seyahatlerinizde ondan zaten oluşturulmuş turları etkilemez.',
  'help.guide.entry-draft.tip.2':
    "Dawarich'ten bir günü devraldığınızda girdiler taslak olarak gelir. Paylaşmadan önce rozete bakın.",
  'help.guide.journey-map-layers.result':
    'Harita yalnızca istediğiniz katmanları gösterir ve her iğne, nokta ve çizginin anlamını açıklamadan okuyabilirsiniz.',
  'help.guide.journey-keep-route.result':
    "Gün başlığında mesafe görünür ve rota, journey'deki herkes için haritanın Kaydedilen katmanında düz çizgiyle çizilir. Paylaşılan bağlantıda rota yalnızca Kaydedilen rotalar açıkken görünür.",
  'help.guide.journey-day-stays.result':
    'Karara bağladığınız konaklamalar satırdan kalkar. Yazdığınız girdiler, diğer girdiler gibi kendi gününde görünür ve fotoğraf ile metni her zamanki gibi ekleyebilirsiniz.',
  'help.guide.journey-take-over-day.tip.2':
    "Taslaklar paylaşılan bağlantılarda görünmez. Fotoğraf ve metin ekleyin, sonra her girdide Taslak'ı kapatın.",
  'help.guide.journey-auto-prepare.tip.2':
    'Bir günün liste düğmesindeki nokta, günün henüz kesinleşmediği anlamına gelir. İpucu nedenini söyler.',
  'help.ctx.settings-plugins.bullet.3':
    'En alttaki Eklenti etkinliği, eklentilerin adınıza yaptığı her işlemi en yeniden eskiye doğru listeler; Yenile düğmesi de burada.',
  'help.guide.language-region.tip.3':
    "Hafta başlangıcı, tüm tarih seçicilerin ilk sütununu belirler. Tatil'in ayrı bir ayarı vardır.",
  'help.guide.web-push-device.tip.2': "iPhone ve iPad'de önce TREK'i Ana Ekran'a ekleyin ve oradan açın.",
  'help.guide.connect-airtrail.step.3':
    "Kaydet'e, sonra Bağlantıyı test et'e tıklayın. TREK kaç uçuş bulduğunu söyler ve rozet Bağlı olarak değişir.",
  'help.guide.connect-dawarich.step.3':
    "Kaydet'e, sonra Bağlantıyı test et'e tıklayın. Son 30 günün konaklamalarını sayar. Bağlandıktan sonra Şimdi denetle hemen kontrol eder, sağdaki Bağlantıyı kes ise bağlantıyı sonlandırır.",
  'help.guide.tour-connect-wanderer.step.3':
    "Kaydet'e, sonra Bağlantıyı test et'e tıklayın. Patikalarınızdan kaçını içe aktarabileceğinizi söyler ve rozet Bağlı olarak değişir.",
  'help.guide.tour-wanderer-watch.step.2':
    "TREK, günde en fazla bir kez içe aktardığınız her patikanın kısa kaydını okur; satırda en son ne zaman baktığı görünür. Bir patika değişmiş olabilirse bildirim alırsınız ve İpuçları bunu sayar. İpuçları'na tıklayıp her turu Değişmiş olabilir, Değişti veya Denetlenemiyor durumuyla görebilir ve oradan açabilirsiniz.",
  'help.guide.plugin-settings.goal':
    'Bir eklentiye kendi anahtarlarınızı ve tercihlerinizi verin, adınıza neler yaptığını görün.',
  'help.guide.own-routing-engine.result': 'Her seyahatteki rotalar sizin sunucularınızda hesaplanır.',
  'help.guide.admin-passkeys.title': 'Passkey ile girişi etkinleştirin',
  'help.guide.rotate-jwt-secret.tip.1': 'Siz de oturumdan çıkarsınız, bu yüzden hemen ardından yeniden giriş yapın.',
  'help.guide.notification-defaults.title': 'Kullanıcılar için bildirim varsayılanlarını belirleyin',
  'help.ctx.notifications.title': 'Bildirimler',
  'help.guide.read-notifications.goal': 'Siz yokken seyahatlerinizde neler olduğunu görün ve doğrudan oraya gidin.',
  'help.guide.filter-notifications.goal': 'Tüm bildirimlerinize ya da yalnızca henüz okumadıklarınıza göz atın.',
  'help.guide.mark-notifications-read.step.1':
    "Yalnızca tek bir bildirimi işaretlemek için bildirimin saatinin yanındaki çift tike, yani Okundu işaretle'ye tıklayın.",
  'help.guide.delete-notifications.step.2':
    'Üstteki Tümünü sil, bir pencerede onay istedikten sonra tüm listeyi tek seferde siler.',
  'help.guide.notification-settings.step.3':
    "Ayarlar kenar çubuğunda Bildirimler'e tıklayın. İlk kartta her olay için bir satır vardır; Uygulama içi sütunu zil simgesinde nelerin görüneceğini belirler.",
  'help.guide.link-journal.result':
    'Seyahatin sekme çubuğunda bir Günlük sekmesi belirir. Okuma ya da Düzenle erişimi verdiğiniz herkes günlüğü bu sekmede, canlı güncellemelerle açabilir.',
  'help.guide.create-place.tip.4':
    "Google Haritalar'dan kopyalanan bir bağlantı aramada da çalışır: yapıştırıp Enter'a basın, TREK yeri bağlantıdan okur. Formda bir konum olduğunda aramanın yanındaki artı imleci olan Bu işaretin yakınındaki yerler, çevredeki yerleri listeler.",
  'help.guide.dawarich-stays.step.2':
    "Konaklamalar güne göre gruplanır; her birinde ne zaman geldiğiniz ve ayrıldığınız yazar. Gösterge simgesi, Dawarich'in emin olmadığı bir konaklamayı işaretler. Konaklamanın yanındaki iğne simgesine, yani Yer olarak ekle'ye tıklayın.",
  'help.guide.leave-stop-off-route.step.3':
    "Durağı yeniden rotaya almak için aynı menüyü açın ve Rotaya geri ekle'yi seçin.",
  'help.guide.move-booking-day.tip.1':
    'Çok günlü bir rezervasyonun aradaki günlerinde görünen soluk satırlar sürüklenemez. Aktarmalı bir uçuşun tek bir bölümü de sürüklenemez.',
  'help.guide.place-image-from-file.step.2':
    'Başlıktaki yuvarlak resme tıklayın. Yerin fotoğrafları olduğu için küçük bir pencere resmin nereden alınacağını sorar.',
  'help.guide.place-own-hours.goal':
    'Bulunan saatler yanlış ya da eksikse, kendi kontrol ettiğiniz saatleri karta ekleyin.',
  'help.guide.place-own-hours.tip.2':
    'Telefon numarası ve e-posta, kartın başlığında etiket olarak görünür. Birine tıklarsanız telefon ya da e-posta uygulamanız açılır.',
  'help.guide.edit-accommodation.tip.3':
    "Ayarlar'da Görünüm altında Rezervasyon Kodlarını Bulanıklaştır açıkken onay numarası bulanık kalır. Okumak için üzerine gelin ya da tıklayın.",
  'help.guide.confirm-stay-booking.tip.1': 'Etikete yeniden tıklarsanız rezervasyon Beklemede durumuna döner.',
  'help.guide.map-markers.tip.4':
    'Ayarlar > Görünüm içinde Seyahat ve harita altında Planlanmamış yerler için küçük işaretler açıkken henüz hiçbir günde olmayan yerler fotoğrafsız ve puansız küçük noktalar olarak görünür. Seçtiğiniz yer her zaman tam boyutta çizilir.',
  'help.guide.tour-map-lines.step.1':
    'Seyahatin her turu haritada kendi renginde bir çizgi olarak, başladığı yerde de iğneyle çizilir. Tur için bir renk seçtiyseniz çizgi o rengi kullanır, seçmediyseniz kategorisinin rengini alır.',
  'help.guide.car-stops.step.6': "Ekle'ye tıklayın.",
  'help.guide.transport-details.step.4':
    "Formu açmadan yolculuğu yeniden adlandırmak için başlığa tıklayın. Yeniden adlandır, ad dolu olarak açılır: yeni adı yazın ve Kaydet'e tıklayın.",
  'help.guide.export-transports-csv.goal':
    "Seyahatin yolculuklarını TREK'ten CSV dosyası olarak alın; elektronik tablo, seyahat acentesi ya da çıktı için kullanabilirsiniz.",
  'help.guide.group-sort-bookings.result':
    'Rezervasyonlar seçtiğiniz bölümlerde ve sırada görünür. Bu tarayıcı seçiminizi bir sonraki ziyaret için saklar.',
  'help.guide.booking-on-map.step.1':
    'Yer / Etkinlik altında ya da konaklama için Konaklama altında bir yere bağlı olan bir rezervasyonun kartına tıklayın. Ayrıntısı açılır.',
  'help.guide.export-bookings-csv.title': 'Rezervasyonları tablo olarak dışa aktarın',
  'help.guide.export-bookings-csv.tip.3':
    'Sekmede bir rezervasyon olur olmaz düğme görünür. Ulaşım sekmesi kendi kayıtlarını aynı şekilde dışa aktarır.',
  'help.guide.arrange-packing-list.title': 'Paket listesini kendi sıranıza koyun',
  'help.guide.count-packed-pieces.result':
    'Satır, parçaların kaçının paketlendiğini gösterir ve son parça da girince öğe işaretlenir.',
  'help.guide.expense-receipts.title': 'Bir harcamaya fiş ekleyin',
  'help.guide.expense-receipts.tip.1':
    'Düzenleyicide listelenen bir dosyanın adına tıklamak aynı önizlemeyi açar. Esc tuşu bu durumda yalnızca önizlemeyi kapatır, harcamayı değil.',
  'help.guide.files-sync-settings.step.5':
    "İki taraf da değiştiğinde, bir belge iki yerde de düzenlendiyse hangi kopyanın kalacağını belirler: Bana sor, TREK kopyasını tut ya da Depodaki kopyayı tut. Otomatik eşitle, TREK'in değişiklikleri arka planda denetlemesini sağlar. Kapalıyken kartta Duraklatıldı yazar ve eşitlemeyi yalnızca Şimdi eşitle çalıştırır. Buradaki her değişiklik anında kaydedilir.",
  'help.guide.manage-notes.step.5':
    "Sil önce Not silinsin mi? diye sorar, çünkü not dosyalarıyla birlikte tüm üyeler için silinir. Onaylamak için Sil'e tıklayın.",
  'help.guide.note-categories.step.3':
    "Yeniden adlandırmak için bir kategorinin adına tıklayın. Yeni adı yazıp Enter'a basın; Esc eski adı korur.",
  'help.guide.roadtrip-reorder.step.2':
    'Bir durağı başka bir güne taşımak için onu o günün kartındaki bir durağın üzerine bırakın. Sürüklerken iki duraktan az olan bir gün, rayın sonunda kesikli çizgili bir kart olarak belirir ve durağı ona da bırakabilirsiniz.',
  'help.guide.roadtrip-corridor.tip.4':
    "Filtrenin altında günün bir durağını ya da İki durağın tam ortası'nı seçin; yalnızca o noktanın 25, 50 veya 100 km çevresindekiler kalır. Listede şarj istasyonları varsa Tum soketler ve Tum gucler bunları soket ve güce göre daraltır.",
  'help.guide.roadtrip-overnight.result':
    'Yer sürüşte o günün konaklaması olarak görünür ve konaklama, seyahatte diğerleri gibi rezerve edilir.',
  'help.guide.roadtrip-stop-fill.result':
    'Bu durakta depo seçtiğiniz değere kadar dolar. Sonrasındaki menzil, varsa Depo burada bitiyor bandı da dahil, buna göre hesaplanır.',
  'help.guide.roadtrip-bookings.step.4': 'Rezervasyonu açmak için karta tıklayın.',
  'help.guide.roadtrip-google-import.goal':
    "Google Haritalar'da planladığınız bir rotayı, günlerinizden birine durak olarak ekleyin.",
  'help.guide.roadtrip-google-import.tip.3':
    'İçe aktarma için bağlantı gerekir; ayrıca hem yerleri hem günleri düzenleme izniniz olmalıdır.',
  'help.guide.roadtrip-hazards.tip.2':
    "DWD Almanya'yı kapsar, GDACS dünya genelindeki afetleri bildirir. Yalnızca nokta olarak verilen bir uyarıda etkilenen alanın bilinmediği yazar.",
  'help.ctx.trip-tours.bullet.5':
    'Gün sütununda bir tur, durak gibi bir satırdır. Başlangıç saati varsa başlangıç → bitiş yazar; bitiş saati turun süresinden hesaplanır. Diğer seçenekler menüsünde Düzenle, Günden kaldır, Rotanın dışında bırak ve Koleksiyona kaydet bulunur.',
  'help.guide.tour-show-list.step.5': "Yer listesine geri dönmek için aynı anahtarda Yer'e tıklayın.",
  'help.guide.tour-add-to-day.step.2':
    'Günü seçin. Menü, seyahatin her gününü tarihi ve başlığıyla listeler. Turu zaten içeren gün soluk görünür.',
  'help.guide.tour-add-to-day.result': 'Tur gününün altında listelenir ve çizgisi haritada o günün bir parçası olur.',
  'help.guide.tour-day-times.tip.2':
    'Çok günlü bir turun yalnızca bir etabını içeren günde hesaplanmış bitiş saati görünmez, çünkü turun süresi tüm rotanın süresidir.',
  'help.guide.tour-remove-from-day.step.3':
    "Ya da günün başlığına tıklayarak günü açın, listede tura tıklayın ve kartın altındaki Günden Kaldır'a tıklayın.",
  'help.guide.tour-filter-list.step.3':
    'Liste farklı değerler içeriyorsa Kaynak (TREK, GPX içe aktarımı, wanderer), Rota sınırı (T1 ile T6) ve Tür (Doğa yürüyüşü, Bisiklet turu vb.) listeyi daha da daraltır. Bir filtreyi temizlemek için işaretli değere yeniden tıklayın.',
  'help.guide.tour-hide-on-map.step.1':
    'Listede bir turun üzerine gelin ve satırın sağında beliren göz simgesine (Haritada gizle) tıklayın.',
  'help.guide.tour-import-plan-tab.step.1': "Plan sekmesinde sağ sütunun üstündeki anahtarda Turlar'a tıklayın.",
  'help.ctx.trip-tour-detail.bullet.1':
    "Turlar listesinde bir tura (önce sağ sütunu Yer'den Turlar'a geçirin), bir günün içindeki satırına ya da haritadaki çizgisine tıklayın. Turun kartı haritanın üzerinde açılır. Kart açıkken harita kullanılabilir kalır.",
  'help.guide.tour-detail-read.step.2':
    'Başlıkta turun adı ve etiketlerle bir özet bulunur: turun türü, içe aktarıldıysa nereden geldiği, planlanan süresi, mesafesi, toplam yükselmesi ve toplam alçalması.',
  'help.guide.tour-detail-read.tip.3':
    'Bazı turlarda daha fazlası görünür: şehir yürüyüşünde durakları, kürek turunda kontroller ve rüzgâr, tamamlanmış turda Gerçek iz, bir listeye bağlı turda da Paket listesi.',
  'help.guide.tour-rename-colour.step.3':
    "Turun yuvarlak kutucuğunun köşesindeki renkli noktaya, yani İz rengi'ne tıklayın. İz rengi bölümü başlığın altında açılır.",
  'help.guide.tour-take-along.step.2':
    'Turun bir web sayfası varsa yanındaki düğmede sitenin adı (Komoot, AllTrails, Outdooractive ya da Wanderer), diğer siteler için Web sitesi yazar. Düğme sayfayı yeni sekmede açar.',
  'help.guide.tour-copy-keep.goal':
    'Bu seyahatte bir turun farklı bir sürümünü oluşturun ya da sonraki seyahatler için koleksiyonlarınızdan birinde saklayın.',
  'help.guide.tour-copy-keep.tip.4':
    'Koleksiyon yalnızca Koleksiyonlar eklentisi açıkken bulunur. Yalnızca okuyabildiğiniz bir liste seçilemez; henüz hiç liste yoksa pencere Koleksiyonları aç seçeneğini sunar.',
  'help.guide.tour-packing-link.step.5':
    "Öğeleri işaretlemek için Paket listesini aç'a tıklayın. TREK, Listeler sekmesinde paket listesine geçer.",
  'help.guide.tour-files.step.2': 'Altındaki satır dosyaları sayar ve liste açılır.',
  'help.guide.tour-activity-link.step.2':
    "Yapıldığı gün altında turu yaptığınız günü seçin. Bir güne ait değilse Gün yok'u seçin.",
  'help.guide.tour-activity-compare.title': 'Planı yaptıklarınızla karşılaştırın',
  'help.guide.tour-activity-compare.result':
    'Günün plana göre nasıl geçtiğini kartta ve haritada kolayca karşılaştırabilirsiniz.',
  'help.guide.tour-origin-check.tip.3':
    "wanderer bağlantısı yok, hesabınızın henüz bağlı olmadığı anlamına gelir. Hesabı Ayarlar'da Entegrasyonlar altında bağlayın.",
  'help.ctx.trip-tour-planner.bullet.5':
    'Haritanın üstündeki Yer veya adres ara haritayı taşır. Sol alttaki etiket, turun türünün sunduğu haritalar (örneğin Topo veya Uydu) arasında geçiş yapar ve açık turun Nokta koy ve 3D gibi anahtarlarını içerir.',
  'help.guide.tour-open-workspace.step.5':
    'Haritanın üstündeki Yer veya adres ara haritayı bir yere götürür, böylece turun bulunduğu yerden başlayabilirsiniz.',
  'help.guide.tour-draw-route.goal':
    'Yeni bir turun noktalarını haritada belirleyin, aralarındaki rotayı TREK hesaplasın.',
  'help.guide.tour-draw-route.tip.2':
    'Haritanın etiketindeki Topo ya da Yürüyüş yolları gösterir, bu da bir yola tıklamayı kolaylaştırır. Türün kullanabileceği hiçbir yola yakın olmayan bir nokta için rota yerine bir uyarı gösterilir.',
  'help.guide.tour-type-profile.step.3':
    'Bisiklet turu, türün altında Profil sorar: Tur, Yol, Çakıl ya da MTB. Altındaki satır profilin neyi tercih ettiğini söyler.',
  'help.guide.tour-edit-points.step.2':
    'Bir noktayı seçmek için Ara noktalar altında satırına tıklayın. İğnesi haritada vurgulanır.',
  'help.guide.tour-shaping-points.title': 'Rotayı bir şekil noktasıyla değiştirin',
  'help.guide.tour-shaping-points.tip.3':
    'At gezisinde çizgiye tıklamak hiçbir şey eklemez, çünkü hiçbir yönlendirici rotayı şekillendirmez.',
  'help.guide.tour-loop-reverse.tip.2':
    'Turu yeniden tek yönlü yapmak için Başlangıca dönüş satırını kaldırın. Elle çizilmiş bir bölüm, tur ters çevrilse de elle çizilmiş kalır.',
  'help.guide.tour-leg-by-hand.step.4':
    'Sonraki bölümü yeniden hesapla, diğer bölümlere dokunmadan yalnızca o bölüm için yönlendiriciye bir kez daha sorar.',
  'help.guide.tour-trip-places.step.3':
    'Bir yere tıklayın. Yer turun yeni bitişi olarak eklenir ve liste bir sonraki yer için açık kalır.',
  'help.guide.tour-details-times.step.1':
    'Sol rayın üstündeki Tur adı alanı adı tutar. Yeni bir turda orada görünen gri metin, örneğin Adsız doğa yürüyüşü, yalnızca bir yer tutucudur: kendi adınızı yazın.',
  'help.guide.tour-save.title': 'Bir turu kaydedin',
  'help.guide.tour-save.tip.3':
    'Bir alanda geçersiz değer varsa, örneğin adres olmayan bir web sitesi, Kaydet çalışmaz. Detaylar bunu göstermek için kendiliğinden açılır.',
  'help.guide.tour-edit-saved.tip.1': 'Değiştirmediğiniz bir turda Kaydet soluk kalır.',
  'help.guide.tour-summary-profile.step.3':
    'İşaretçiyi Yükseklik profili üzerinde gezdirin. O noktadaki mesafe ve yükseklik görünür, haritada da aynı yer bir noktayla işaretlenir.',
  'help.guide.tour-list-manage.step.1':
    'Gezinin toplamı listenin üstündedir. Daraltılmışken tur sayısını ve kaçının Planlandı, kaçının Planlanmamış olduğunu gösterir. Sağındaki ok, her tür için mesafe, toplam yükselme, toplam alçalma ve süreler toplanmış bir satır açar.',
  'help.guide.tour-list-manage.result':
    'Filtrenin gösterdiği turların toplamlarını görürsünüz ve her tur istediğiniz günde yer alır.',
  'help.guide.tour-delete.result': 'Tur listeden, haritadan ve tüm günlerden kalkar.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Turu başka bir cihazda değiştirdiyseniz de aynısı olur. Değiştirmediğiniz bir tur yalnızca yeniden yüklenir ve bir not bunu belirtir.',
  'help.ctx.trip-tour-import.bullet.5':
    "wanderer, Ayarlar, Entegrasyonlar altında bağlandığında, hiçbir tur açık değilken Yeni tur planla'nın yanında bir wanderer düğmesi görünür. Düğme içe aktarabileceğiniz kendi patikalarınızı listeler.",
  'help.guide.tour-import-gpx.tip.1':
    'Dosyaları bilgisayarınızdan Turlar sekmesine sürükleyip bırakabilirsiniz de. Aynı önizleme açılır.',
  'help.guide.tour-view-import.step.1':
    'Turlar sekmesinde, Bu seyahatin turları içinde GPX içe aktarımı rozeti olan bir tura tıklayın.',
  'help.guide.tour-plan-from-import.goal':
    'Kaydedilmiş bir izden taşıyabileceğiniz ara noktalar oluşturun ve yeni rotanın ize ne kadar yakın kaldığını görün.',
  'help.guide.tour-plan-from-import.tip.4': 'At gezisinin düzenlenebilir sürümü yoktur: sürüldüğü gibi saklanır.',
  'help.guide.tour-restore-recorded.tip.2':
    'Yeni tur olarak planla ile oluşturulan turun kendi kaydedilmiş izi yoktur. Geldiği içe aktarma hâlâ listededir.',
  'help.guide.tour-take-over.step.5': 'İsterseniz Bu gezideki ad altında tura başka bir ad verin.',
  'help.guide.tour-import-wanderer.step.1':
    "Turlar sekmesinde, hiçbir tur açık değilken Yeni tur planla'nın yanındaki wanderer'a tıklayın.",
  'help.guide.tour-import-wanderer.result': 'Patika seyahatin bir turu olur ve haritada wanderer turu olarak açılır.',
  'help.guide.tour-map-layers.title': 'Bir tur için harita seçin',
  'help.guide.tour-map-layers.tip.3':
    'Kürek turu ve şehir yürüyüşü yalnızca Harita ve Uydu sunar. Koşu, kayak turu ve at gezisi Harita, Topo ve Uydu sunar.',
  'help.guide.tour-along-search.result':
    'Rota boyunca bulunan yerler listede ve haritada, incelemeye hazır olarak görünür.',
  'help.guide.tour-along-add-stop.step.3':
    "Mola olarak ekle'ye tıklayın. Yanındaki rozet, düz çizgiyle ölçülen yaklaşık bir sapma tahminidir.",
  'help.guide.tour-3d-terrain.step.1':
    "Turlar sekmesinde bir tur açın ve sol alttaki etiketin sonundaki 3D'ye tıklayın. Harita eğilir, araziyi 3B olarak gösterir ve rota arazinin üzerine çizilir.",
  'help.guide.tour-3d-terrain.tip.3':
    'Arazi görünümü için bağlantı gerekir: yükseklikler açık Mapzen arazi karolarından gelir. Kürek turu, su düz olduğu için dereceler olmadan kendi renginde çizilir.',
  'help.guide.tour-3d-flyover.tip.1':
    'Uçuş sırasında yakınlaşmak ya da uzaklaşmak için fare tekerleğini çevirin. Kamera noktanın üzerinde kalır. Duraklatana kadar haritayı sürükleyemezsiniz.',
  'help.guide.tour-map-overlays.step.4':
    'Kürek turunda etiket bunun yerine Deniz işaretleri sunar. Şamandıraları, fenerleri ve liman işaretlerini suyun üzerinde göstermek için ona tıklayın.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Bir durağın Diğer işlemler menüsündeki Etabı burada bitir, etabı o durakta bitirir. Ara noktalar bölümünde her etap için mesafesi ve süresiyle bir Etap N başlığı görünür; etabı bitiren durakta ay simgesi bulunur.',
  'help.guide.tour-multi-day.step.3':
    "İlk günün bittiği durağın üzerine gelin, Diğer işlemler'e tıklayın ve Etabı burada bitir'i seçin.",
  'help.guide.tour-multi-day.result':
    "Etaplara bölünmüş tek bir rota elde edersiniz, her etap kendi başına ölçülür. Saklamak için Kaydet'e tıklayın.",
  'help.guide.tour-stages-on-days.step.6': 'Yanındaki ok (Bu etabı planlayıcıda aç), turu düzenleyicide o etapta açar.',
  'help.ctx.trip-tour-hike.bullet.1':
    "Düzenleyicinin üstündeki Tur türü rotanın nasıl planlanacağını belirler. Doğa yürüyüşü, Detaylar altındaki En yüksek patika zorluğu'na kadar olan patikaları kullanır. Koşu koşulabilir yolları kullanır ve Planlanan tempo'nuzu ister.",
  'help.guide.tour-hike-plan.step.1':
    "Sol sütunun üstündeki Yeni tur planla'ya tıklayın. Düzenleyici Yeni tur olarak açılır.",
  'help.guide.tour-hike-plan.tip.2':
    'T4 ve üstü için önce Yüksek dağ rotaları etkinleştirilsin mi? sorulur. Yalnızca rota açıkta ya da işaretsiz araziden geçebilecekse onaylayın. Bu soru her düzenleme oturumunda bir kez gelir.',
  'help.guide.tour-hike-trail-details.step.4':
    'Haritada yalnızca o kesimleri çizmek için listede bir dereceye tıklayın. Tüm rotayı yeniden göstermek için derecenin üzerine bir kez daha tıklayın.',
  'help.guide.tour-hike-round.step.1':
    "Yürüyüş açıkken Ara noktalar kartının başlığında Başlangıçtan döngü rotası'na tıklayın. Başka bir duraktan başlamak için o durağın Diğer işlemler'ini açın ve Buradan döngü rotası'nı seçin.",
  'help.guide.tour-hike-round.tip.3':
    'Yeniden ara mesafe adımına geri döner, İptal ise kartı hiçbir şeyi değiştirmeden kapatır.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Bunu yalnızca yürüyüşler sunar ve yalnızca yönlendiricinin planladığı bölümler için geçerlidir, elle çizilen bölümler için değil.',
  'help.guide.tour-ferrata-add.step.4':
    "Ara noktalar bölümünde, o iki nokta arasındaki bölümde via ferrata'nın adı, derecesi ve uzunluğu görünür.",
  'help.guide.tour-run-plan.goal': 'Koşulabilir yollarda bir koşu planlayın ve süresini temponuzdan hesaplayın.',
  'help.guide.tour-run-plan.tip.2':
    'Tırmanışlar, inişler ve yolun ne kadar teknik olduğu süreye dahil değildir: süre mesafe çarpı tempodur, başka bir şey değil.',
  'help.guide.tour-run-ways.result': 'Gitmeden önce koşunun hangi kısımlarının asfalt olmadığını bilirsiniz.',
  'help.ctx.trip-tour-walk.bullet.4':
    "Tur boyunca, rotanın belli bir mesafe çevresindeki görülecek yerleri Yürüyüş teması'na göre bulur. Mola olarak ekle ise seçtiğiniz bir yeri yürüyüşte seçtiğiniz noktaya planlar.",
  'help.guide.tour-walk-plan.step.5':
    "Önem'i Olağan, İsteğe bağlı ya da Mutlaka görülmeli olarak ayarlayın. Sonradan bir değişiklik önerilse bile yerinde kalması gereken bir durak için Korunuyor'u açın, sonra Kaydet'e tıklayın.",
  'help.guide.tour-walk-sights.step.1':
    "Bir şehir yürüyüşü açıkken sol sütunda Tur boyunca'yı bulun ve bir Yürüyüş teması seçin: Kültür ve tarih, Parklar ve manzaralar, Yemek ve yerel yaşam ya da Her şeyden biraz.",
  'help.guide.tour-walk-sights.result':
    'Görülecek yer yürüyüşün bir durağı olur ve seçtiğiniz duraklar arasındaki rotaya planlanır.',
  'help.guide.tour-walk-day-times.tip.2':
    'Bir durağın henüz kalış süresi yoksa, ondan sonraki varış saatleri mümkün olan en erken saatler olarak gösterilir.',
  'help.guide.tour-walk-google-import.step.3':
    'Bağlantıdaki duraklar listesini kontrol edin. Bağlantıda konumu olmayan bir durak işaretlenir ve dışarıda bırakılır.',
  'help.guide.tour-walk-check-off.step.1':
    'Plan sekmesinde şehir yürüyüşüne kendi gününde tıklayın. Kartı haritanın yanında açılır.',
  'help.ctx.trip-tour-bike.title': 'Bisiklet turları',
  'help.guide.tour-bike-profile.step.1': "Turlar sekmesinde sol rayın üstündeki Yeni tur planla'ya tıklayın.",
  'help.guide.tour-bike-profile.tip.2':
    'Profil yalnızca yönlendiriciye yol gösterir. Bir yolun bisikletle sürülüp sürülemeyeceği hakkında bir şey söylemez: rotanın hangi zeminde olduğunu Zemin ve yollar kartı gösterir.',
  'help.guide.tour-bike-surfaces.step.3':
    'Zemin altında Çakıl ya da Doğal zemin gibi bir satıra tıklayın. Bu zemindeki kesimler haritada vurgulanır. Vurguyu kaldırmak için satıra yeniden tıklayın.',
  'help.guide.tour-bike-mtb-grades.goal': 'Bir MTB turundaki patikaların ne kadar zor olduğunu sürmeden önce görün.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    "Profil'i MTB dışında bir şeye çevirirseniz derece bölümleri kaybolur. Rota sonra yeni profile göre yeniden planlanır.",
  'help.guide.tour-ski-plan.title': 'Kayak ve kış turu planlayın',
  'help.guide.tour-ski-plan.tip.1':
    "Kayaklı koşu için ayrıca Teknik'i seçin: Klasik, Serbest stil ya da Bilinmiyor. Alanların altındaki not, neyin hâlâ eksik olduğunu söyler.",
  'help.guide.tour-ski-options.step.2':
    "En zor pistler'i açın ve kaymak istediğiniz en yüksek dereceyi seçin, Acemi'den Uzman'a kadar. Varsayılan Orta'dır.",
  'help.guide.tour-ski-fix-leg.title': 'Planlanamayan bir kayak bölümünü düzeltin',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Her bölüm planlanana kadar Pist rotası kartında henüz kayak süresi olmadığı yazar.',
  'help.guide.tour-ski-summary.tip.2':
    'Kayak süresi, her bölüm planlanana kadar Hesaplanmadı olarak kalır. Tura yine de bir süre vermek için ayrıntılarına planlanan bir toplam süre girin.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Açıklama; inişleri zorluğa göre, kayaklı koşu parkurlarını, kış ve kar ayakkabısı yollarını, kızak yollarını ve liftleri gösterir. OpenSnowMap’te tam açıklama, açıklamanın tamamını açar.',
  'help.guide.tour-ski-import.step.2': "İçe aktarma önizlemesinde Şu olarak içe aktar'ı açın ve Kayak ve kış'ı seçin.",
  'help.guide.tour-ski-import.result':
    'İz, Bu seyahatin turları içinde yer alır; branşı ve tekniği Kayak izi kartında görünür.',
  'help.ctx.trip-tour-paddle.bullet.6':
    "Sol sütunun altındaki Kürek çekmenin riskleri vardır satırı Suda güvenlik'i açar. Harita, Harita ve Uydu seçeneklerini sunar; Deniz işaretleri ise ek katman olarak eklenir.",
  'help.guide.tour-paddle-setup.step.6':
    'Kürek hızı alanında teknenin önerdiği hız gri görünür. Kendi hızınızı yazarsanız alanda Kendi hızın yazar. Altındaki bağlantı (Önerileni kullan) teknenin hızına geri döner.',
  'help.guide.tour-paddle-water-route.goal':
    "TREK'in nehir ya da göl boyunca bir bölüm planlamasını sağlayın ve planlayamadığı bir bölümün notlarını anlayın.",
  'help.guide.tour-paddle-water-route.tip.3':
    'Planlanmış bir bölümün altındaki notlar, derecesiyle birlikte Whitewater, bir Kano geçidi ya da düz çizgiyle köprülenen bir Harita verilerinde boşluk olduğunu belirtir.',
  'help.guide.tour-paddle-portage.step.4':
    'Rota altında Patikayı izle haritalanmış bir yoldan taşır, Düz çizgi ise doğrudan karşıya geçer. TREK patikayı kendiliğinden arar ve uzun bir dolambaç gerektirmeden bulunamıyorsa bunu söyler.',
  'help.guide.tour-paddle-lock.step.1':
    "Kilidin bulunduğu durağın üzerine gelin ve üç nokta olan Diğer işlemler'e tıklayın.",
  'help.guide.tour-paddle-time.title': 'Bir kürek turunun süresini okuyun ve ayarlayın',
  'help.guide.tour-paddle-time.tip.2': 'Akıntı ve rüzgâr tahmine dahil değildir.',
  'help.guide.tour-paddle-wind.step.4':
    "Karşı rüzgârın, yan rüzgârın, açık su geçişlerinin ve hamlelerin tekneyi nasıl etkilediğini okumak için Rüzgâr kürek çekerken ne anlama gelir'i açın.",
  'help.guide.tour-paddle-checklist.step.1':
    "Kürek turunu kaydedin, sonra sol sütunda Kontrol listesi'ni bulun. Başlığındaki rozet listenin durumunu özetler.",
  'help.guide.tour-paddle-checklist.tip.4':
    "Engeller, TREK'in elindeki bölgelerin OpenStreetMap verisinden gelir. Verinin olmadığı yerde kart bunu söyler ve savakları, kilitleri ve taşıma yollarını kendiniz kontrol edersiniz.",
  'help.guide.tour-paddle-track-marks.step.4':
    'Bu seyahatin turları içinde ize tıklayın. Sol sütun izi kaydedildiği gibi, Taşımalar ve kilitler kartıyla birlikte gösterir.',
  'help.ctx.trip-tour-horse.title': 'At gezileri',
  'help.guide.tour-horse-plan.goal':
    'Harita görünümündeki işaretli at rotalarının bölümlerinden bir at gezisi oluşturun.',
  'help.guide.tour-horse-plan.result':
    'Gezi, aldığınız bölümleri izler; her bölümde rotanın adı, erişim noktası ve uzunluğu görünür. Gezi Bu seyahatin turları altında listelenir.',
  'help.guide.tour-horse-gap.step.1':
    'Gezide bir bölüm varken başka bir rota açın ve gezinizin sonuna değmeyen bir bölüm seçin. Geziye bağlantı altında bir not aradaki uzaklığı söyler.',
  'help.guide.tour-horse-recorded.title': 'GPX dosyasından kaydedilmiş bir geziyi saklayın',
  'help.guide.tour-horse-recorded.tip.2':
    'Yüksekliği olmayan bir dosyada sıfır çıkış yerine Dosyada yükseklik yok yazar.',
  'help.guide.dateless-trip.tip.1':
    'Ne zaman gideceğini öğrenince karttaki kalem simgesiyle formu aç ve tarihleri seç. Planladığın günler sıralarını korur ve tarihleri bu sırayla alır.',
  'help.guide.trip-reminder.goal': 'Yola çıkmadan birkaç gün önce hatırlatma al.',
  'help.guide.upcoming-reservations.tip.2':
    '“Beklemede” henüz onaylanmamış bir rezervasyonu belirtir. İptal edilen rezervasyonlar ve arşivlenen seyahatler listede yer almaz.',
  'help.guide.half-company-holiday.tip.1':
    'O güne daha önce girilmiş izin yarım güne düşer. Sonradan o günü giren herkes yalnızca 0,5 gün kullanır.',
  'help.guide.edit-holiday-calendar.goal':
    'Eklediğin resmi veya okul tatili takvimini yeniden adlandır, rengini değiştir, taşı ya da sil.',
  'help.guide.person-color.title': 'Bir kişinin rengini değiştir',
  'help.guide.answer-fusion-request.tip.1':
    'İstek, sen yanıtlayana kadar açık kalır. Birden fazla istek varsa sırayla görürsün.',
  'help.guide.log-for-partner.tip.1': '“Yarım gün” ve “Serbest zaman” seçili kişi için de geçerlidir.',
  'help.guide.dissolve-fusion.tip.2': 'Birinin yalnızca günlerini görmesini istiyorsan bunun yerine takvimini paylaş.',
  'help.guide.country-details.tip.2':
    'Ülke için sayılan tüm yerleri seyahate göre gruplanmış halde görmek için “Yer” rozetine tıkla.',
  'help.guide.country-places.tip.2':
    'Rozet yalnızca ülkenin kendi yerleri varsa görünür. Yalnızca elle işaretlediğin bir ülkede hiç yer yoktur.',
  'help.guide.tour-activity-stats.goal':
    'Tüm seyahatlerinde yaptığın turların mesafesini, tırmanışını ve sayısını seçtiğin dönem ve türe göre gör; gerçekleşmeyen bir turu dışarıda bırak.',
  'help.guide.tour-activity-stats.tip.1':
    'Bir tur, son günü geçtikten sonra sayılır. Hiçbir güne eklenmemiş ya da yalnızca tarihsiz günlere eklenmiş bir tur hiç sayılmaz. Saydırmak için turu seyahatindeki tarihli bir güne ekle.',
  'help.guide.move-to-list.result':
    'Yerler diğer listeye geçer; kısa bir not kaç yerin taşındığını veya çoğaltıldığını söyler.',
  'help.guide.accept-list-invite.tip.1':
    'Listede neler yapabileceğin, sahibinin sana verdiği role bağlıdır: Görüntüleyici, Editör ya da Yönetici.',
  'help.guide.tour-collection-add-to-trip.title': 'Listedeki bir turu seyahate ekle',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Bir turu listede tutmak için seyahatte kayıtlı bir turu aç ve alt kısmındaki “Koleksiyon”a tıkla.',
  'help.guide.tour-collection-manage.tip.2': 'Çöp kutusunu yalnızca listenin sahibi ve yöneticileri görür.',
  'help.guide.entry-draft.result':
    'Girdi zaman çizelgende “Taslak” olarak işaretli kalır ve paylaşılan bağlantıda gösterilmez.',
  'help.guide.journey-map-layers.title': 'Journey haritasının neyi göstereceğini seç',
  'help.guide.journey-keep-route.title': 'Bir günde kaydettiğin rotayı koru',
  'help.guide.journey-day-stays.title': "Dawarich'in kaydettiği duraklardan girdi yaz",
  'help.guide.journey-take-over-day.title': 'Kaydedilmiş bir günün tamamını devral',
  'help.guide.journey-take-over-day.result':
    'Gün artık her durak ya da birleştirilmiş grup için bir taslak veya tek bir gün raporu içerir; durakları artık açık olarak listelenmez.',
  'help.guide.journey-auto-prepare.result':
    'Bağlı bir seyahat sürerken her günün durakları o günde listelenir ve “Günü aktar” için hazır bekler.',
  'help.ctx.settings-about.title': 'Hakkında',
  'help.guide.web-push-device.tip.3':
    "Anlık bildirim için TREK'in HTTPS üzerinden açılmış olması gerekir. Bildirimler engellenmişse tarayıcı ayarlarından izin ver ve tekrar dene.",
  'help.guide.connect-airtrail.result':
    "Rozet “Bağlı” gösterir ve seyahatin “Ulaşım” sekmesinde “AirTrail'den içe aktar” seçeneği çıkar.",
  'help.guide.connect-dawarich.result':
    "Rozet “Bağlı” gösterir; seyahat planlayıcı, günlük ve Atlas Dawarich'in kaydettiklerini sunabilir.",
  'help.guide.tour-connect-wanderer.result':
    "Rozet “Bağlı” gösterir; seyahatin “Turlar” sekmesi wanderer'da arama yapıp patikalarını içe aktarabilir.",
  'help.guide.tour-wanderer-watch.result':
    'TREK, içe aktardığın patikaları izler ve biri değişmiş olabilirse sana haber verir. Bir tur ancak sen değişikliği kabul edersen değişir.',
  'help.guide.plugin-settings.step.1':
    'Ayarlar kenar çubuğunda “Eklentiler”i aç. “Eklenti ayarları” altında, senden ayar bekleyen her eklentinin alanlarını içeren bir kart bulunur: alanları doldur ve “Kaydet”e tıkla. Karttaki işlemler onayından sonra çalışır.',
  'help.guide.profile.step.3': 'Kartın alt kısmının sağındaki “Profili Kaydet”e tıkla.',
  'help.guide.default-user-settings.title': 'Yeni kullanıcıların neyle başlayacağını belirle',
  'help.guide.own-routing-engine.tip.1':
    'Herkese açık OSRM sunucuları saniyede yaklaşık bir isteğe izin verir. Bir gün için bu yeterli, ama bir yol gezisi için yavaş kalabilir.',
  'help.guide.admin-passkeys.goal': "İnsanların parmak izi, yüz ya da cihaz PIN'iyle giriş yapmasını sağla.",
  'help.guide.rotate-jwt-secret.tip.2':
    'Yalnızca tek bir kişinin oturumunu kapatmak için “Kullanıcıyı Düzenle” altında ona bir “Yeni Şifre” ver. Bu yalnızca onun oturumlarını sonlandırır.',
  'help.guide.notification-defaults.goal':
    'Her kullanıcının bildirimlerinin nasıl başlayacağını belirle ve bir olay için bir kanalı tamamen engelle.',
  'help.ctx.notifications.summary':
    "TREK'in uygulama içinde sana gösterdiği tüm bildirimler, en yenisi başta: birinin değiştirdiği bir rezervasyon, bir seyahat sohbetindeki yeni mesaj, seninle paylaşılan bir takvim. Sağ üstteki zil en yeni on bildirimi gösterir, bu sayfa hepsini.",
  'help.guide.read-notifications.step.1':
    'Sağ üstteki zile tıkla. Üzerindeki kırmızı sayı, henüz okumadığın bildirimlerin sayısıdır.',
  'help.guide.filter-notifications.step.1': 'Sağ üstteki zile tıkla.',
  'help.guide.mark-notifications-read.step.2':
    'Tüm bildirimleri tek seferde okundu olarak işaretlemek için üstteki “Tümünü okundu işaretle”ye tıkla.',
  'help.guide.delete-notifications.tip.1':
    'Silmek bildirimi yalnızca senin için kaldırır. Bildirimin ilgili olduğu rezervasyon, mesaj veya paylaşım olduğu gibi kalır.',
  'help.guide.notification-settings.tip.1':
    'Bir hücredeki kilit, yöneticinin o olayı herkes için kapattığı anlamına gelir.',
  'help.guide.add-guest.tip.3':
    'Misafirleri yalnızca seyahatin sahibi ekleyebilir, yeniden adlandırabilir ve kaldırabilir. Bir harcamayı ödeyen misafir, ödeyen kişiyi değiştirene ya da ödemeyi silene kadar kaldırılamaz.',
  'help.guide.link-journal.tip.1':
    'Yalnızca sahibi olduğun günlükleri bağlayabilirsin. Sadece yazma yetkin olan bir günlüğü bağlayamazsın.',
  'help.ctx.trip-places.bullet.7':
    'Aramanın yanındaki onay işareti seçim modunu başlatır. Sütunun altındaki çubukla birkaç satıra aynı anda yeni bir kategori verebilir, bir koleksiyona ekleyebilir, ziyaret edildi olarak işaretleyebilir ya da silebilirsin.',
  'help.guide.filter-places.step.5':
    'Seyahat birden fazla ülkeyi ya da bölgeyi kapsıyorsa küre simgesi listeyi bir ülkeye veya o ülkedeki bir bölgeye göre filtreler; her biri yanında sayısıyla listelenir. “Filtreyi temizle” seçimi “Tüm ülkeler”e döndürür.',
  'help.guide.import-places-file.tip.3':
    '“Turlar” açıksa, ki varsayılan budur, dosyayı sütunun üstündeki “Turlar” üzerinden “GPX veya KML içe aktar” ile içe aktarırsın ve dosyadaki çizgiler tur olur. Dosyadaki iğneler burada içe aktarılmaz, çünkü turlar yalnızca çizgilerden oluşur.',
  'help.guide.dawarich-stays.step.3':
    '“Ad”, “Varış” ve “Ayrılış” değerlerini kontrol et, bir “Gün” seç ya da “Henüz bir güne bağlı değil” olarak bırak, istersen “Notlar” ekle ve “Yer ekle”ye tıkla.',
  'help.guide.leave-stop-off-route.result':
    "Durak hâlâ günün ve PDF'in bir parçasıdır; “Rota dışı” olarak işaretliyken rota, kendisinden önceki duraktan sonrakine düz gider.",
  'help.guide.move-booking-day.tip.2':
    'Kendi günü içinde saati olan bir rezervasyon her zaman saatinin olduğu konuma geri döner.',
  'help.guide.place-image-from-file.step.3':
    '“Ekli dosyalardan” altında istediğin fotoğrafa tıkla. Bunun yerine bilgisayarından yeni bir fotoğraf seçmek için üstündeki “Cihazdan yükle”yi kullan.',
  'help.guide.place-own-hours.step.1': 'Yeri aç ve kartın sağ altındaki “Düzenle”ye tıkla. Yerin formu açılır.',
  'help.guide.place-own-hours.tip.3':
    '“Çalışma saatlerini kaldır”a, ardından “Güncelle”ye tıkla; otomatik bulunan saatler karta yeniden gelir.',
  'help.guide.confirm-stay-booking.title': 'Bir konaklamanın rezervasyonunu onayla',
  'help.guide.confirm-stay-booking.tip.2':
    'Aynı etiket her rezervasyonda çalışır; gündeki “Rezervasyonlar” altında listelenenlerde de.',
  'help.guide.map-lock.tip.2':
    'Tarayıcı, kilidi her seyahat için hatırlar. Bir seyahati açtığında harita yine de bir kez seyahate yakınlaşır, böylece boş bir bölgede açılmaz.',
  'help.guide.tour-map-lines.step.2':
    'Çizgiye ya da başındaki iğneye tıkla. Turun kartı haritanın alt kısmında açılır ve çizgisi beyaz kenarlıkla daha kalın çizilir, böylece diğer çizgiler arasında kolayca seçilir. Kartın başlığındaki X kartı kapatır.',
  'help.guide.car-stops.title': 'Yol üzerinde duraklar olan bir sürüş planla',
  'help.guide.car-stops.result':
    'Sürüş, “Ulaşım” sekmesinde bir kart ve gününde bir satır olarak görünür. Haritadaki çizgisi alış noktasından başlar, tüm duraklardan sırayla geçer ve iade noktasına varır.',
  'help.guide.transport-details.step.5':
    'Ayrıntıların altındaki “Haritada” yolculuğun çizgisini gösterir ve ilgili günün “Plan” sekmesini açar. En sağdaki “Düzenle” tam formu açar, yanındaki çöp kutusu ise onayından sonra yolculuğu siler.',
  'help.guide.export-transports-csv.step.1':
    'Yalnızca bir kısmını istiyorsan önce listeyi daralt. “Ara”, “Filtrele” ve “Görünüm seçenekleri” altındaki sıralama dahil hepsi dikkate alınır: dosyada sekmede gördüğün kayıtlar, gösterildiği sırayla yer alır.',
  'help.guide.group-sort-bookings.tip.1':
    '“Kartlar” ve “Liste” kendi gruplamalarını korur: “Kartlar” “Durum”la, “Liste” “Gün”le başlar. “Görünüm seçenekleri”ndeki nokta, bir şeyin varsayılandan farklı olduğunu gösterir; panelin altındaki “Görünümü sıfırla” varsayılana döner.',
  'help.guide.booking-on-map.step.2': 'Ayrıntıların altındaki “Haritada”ya tıkla.',
  'help.guide.export-bookings-csv.goal':
    'Seyahatin rezervasyonlarını Excel, Numbers veya başka bir hesap tablosunda açmak üzere CSV dosyası olarak dışa aktar.',
  'help.guide.arrange-packing-list.goal':
    'Tüm listeleri ve tek tek öğeleri istediğin yere taşı ya da her listeyi ad sırasına göre gör.',
  'help.guide.check-off-packing.tip.4':
    'Miktarı birden fazla olan bir öğede parçaları tek tek de işaretleyebilirsin. Bkz. “Bir şeyin birkaç parçasını paketle”.',
  'help.guide.count-packed-pieces.tip.1':
    'Kutuyu işaretlemek tüm parçaları tek seferde paketlenmiş yapar, işareti kaldırmak hepsini yeniden paketlenmemiş yapar.',
  'help.guide.expense-receipts.goal':
    'Fişi veya faturayı ait olduğu harcamayla birlikte sakla ve harcama defterinden tekrar aç.',
  'help.guide.expense-receipts.tip.2':
    'Fişin yanındaki çöp kutusu, kaydettiğinde fişi harcamadan çıkarır. Dosyanın kendisi “Dosya” bölümünde kalır; tamamen kaldırmak için orada sil.',
  'help.guide.files-sync.tip.4':
    'Kartta “Yeniden bağlan” düğmeli sarı bir uyarı görünüyorsa depolama, kayıtlı girişi artık kabul etmiyor demektir. “Yeniden bağlan”a tıkla, yeni bir uygulama şifresi veya belirteç gir; eşitleme yeniden başlar.',
  'help.guide.files-sync-settings.result':
    'Bir sonraki çalıştırmadan itibaren seyahat yalnızca seçtiğin yönde eşitlenir; silmeler ve çakışan düzenlemeler belirlediğin kurallara göre ele alınır.',
  'help.guide.manage-notes.result':
    'Not, “Notlar” kartından tüm üyeler için aynı anda kalkar. Yalnızca sabitlediğin veya değiştirdiğin bir not kalır; diğerleri onu bıraktığın haliyle görür.',
  'help.guide.note-categories.step.4':
    'Satırdaki renk noktaları o kategorinin rengini belirler: Indigo, Kırmızı, Kehribar, Zümrüt, Mavi veya Mor. Burada “Konaklama” kehribar olur.',
  'help.guide.roadtrip-reorder.step.3':
    'Klavyeyle bir durağa odaklan ve gün içinde bir sıra taşımak için Alt ile yukarı veya aşağı ok tuşuna bas.',
  'help.guide.roadtrip-overnight.title': 'Rota üzerinde bir gece geçir',
  'help.guide.roadtrip-overnight.tip.1':
    'Gece ertesi güne kadar sürer. Başka tarihler için rezervasyonu değiştir: tarihleri, konaklamanın geri kalanıyla birlikte “Gün” altında değiştir.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Rozeti yalnızca arabanın yakıt alabileceği duraklar gösterir: “Benzin” için akaryakıt durakları, “Elektrik” için şarj durakları, “İkisi de” için ikisi birden.',
  'help.guide.roadtrip-bookings.result':
    'Rezerve edilen her yolculuk, sürüşte gerçekleştiği noktada yer alır; öncesindeki ve sonrasındaki rota onun terminallerine gider ve terminallerinden devam eder.',
  'help.guide.roadtrip-google-import.step.1':
    '“Rota üzerinde”nin üstündeki üç noktaya tıkla ve “Google Maps rotasını içe aktar”ı seç.',
  'help.guide.roadtrip-hazards.title': 'Güncel uyarıları haritada göster',
  'help.guide.roadtrip-hazards.tip.3':
    'Veri akışları on dakikada bir yenilenir ve internet bağlantısı gerekir. Diğer sürüş ayarları gibi bu anahtar da seyahate özel kaydedilir.',
  'help.ctx.trip-tours.bullet.6':
    'Rotayı değiştirme ve turu silme işlemleri “Turlar” sekmesinde, “Bu seyahatin turları” altında yapılır.',
  'help.guide.tour-show-list.tip.1': 'Haritada bir turun çizgisine tıkla; liste o turu işaretler ve ona kaydırır.',
  'help.guide.tour-add-to-day.step.3':
    '“10. güne eklendi” mesajı eklemeyi doğrular, satırda “Gün” rozeti belirir ve soldaki sütunda ilgili günde tur; saati, mesafesi ve tırmanışıyla birlikte listelenir.',
  'help.guide.tour-day-times.title': 'Bir tura gününde başlangıç saati ver',
  'help.guide.tour-day-times.tip.3':
    'Aynı menüdeki “Rotanın dışında bırak” turu günde tutar ama haritada günün rotasına katmaz. “Rotaya geri ekle” bunu geri alır.',
  'help.guide.tour-remove-from-day.tip.1':
    'Çok günlü bir turu günlerden tek tek çıkarırsın, çünkü her günün kendi etabı vardır.',
  'help.guide.tour-filter-list.step.4':
    'Menüyü kapat. Düğmede artık durum, kalan tur sayısı ve belirlediğin her ek filtre için +1 yazar.',
  'help.guide.tour-hide-on-map.step.2':
    'Turun çizgisi haritadan gizlenir. Satırı listede soluk görünür ve üstü çizili bir göz (“Haritada göster”) taşır. Çizgiyi yeniden göstermek için ona tıkla.',
  'help.guide.tour-import-plan-tab.step.2':
    'Listenin üstündeki “GPX veya KML içe aktar”a tıkla ve dosyalarını (GPX, KML veya KMZ) seç.',
  'help.ctx.trip-tour-detail.bullet.2':
    'Başlıkta turun yuvarlak kutucuğu, yeniden adlandırmak için kalem simgeli adı, çizgisinin rengini gösteren renkli bir nokta ve tür, geldiği yer, planlanan süre, mesafe, toplam yükselme ve toplam alçalma için etiketler bulunur. Sağdaki X kartı kapatır; Escape tuşu da kapatır.',
  'help.guide.tour-detail-read.step.3':
    'Sürenin neyden oluştuğunu görmek için işaretçiyi sürenin üzerine getir: hareket halindeki süre, molalar ve planlanan toplam.',
  'help.guide.tour-detail-read.tip.4':
    'Kart rotayı değiştirmez. Bir noktayı taşımak veya bir bölümü yeniden çizmek için “Turlar” sekmesini aç ve “Bu seyahatin turları” altındaki tura tıkla.',
  'help.guide.tour-rename-colour.step.4':
    'Bir renk seç. İlk hücre olan “Otomatik renk” çizgiyi varsayılan rengine döndürür, son hücre olan “Özel renk seç” ise istediğin rengi seçmene izin verir. Haritadaki çizgi ve “Turlar” listesindeki şerit hemen güncellenir.',
  'help.guide.tour-take-along.step.3':
    'Kayıtlı turu GPX dosyası olarak indirmek için “GPX”e tıkla: tüm rotası, varsa yükseklik bilgisiyle birlikte, navigasyon uygulaması veya GPS cihazı için hazır gelir.',
  'help.guide.tour-copy-keep.step.1':
    'Turun kartını aç ve alttaki “Kopyala”ya tıkla. TREK günleri olmayan yeni ve bağımsız bir tur oluşturur; asıl tur olduğu gibi kalır.',
  'help.guide.tour-copy-keep.result':
    'Seyahatte özgürce değiştirebileceğin ikinci bir tur olur; koleksiyonda ise başka bir seyahate eklenmeye hazır kendi kopyası durur.',
  'help.guide.tour-packing-link.tip.1':
    'Bu yalnızca bir bağlantıdır. Hiçbir şey kopyalanmaz ya da taşınmaz, öğeler “Listeler”de kalır. Orada birini işaretlersen tur bunu hemen gösterir.',
  'help.guide.tour-files.step.3': 'Açmak için bir dosyaya tıkla.',
  'help.guide.tour-activity-link.step.3':
    '“İz” altında kaydı seç ya da yeni bir dosya eklemek için “GPX içe aktar”a tıkla.',
  'help.guide.tour-activity-compare.goal':
    'Gerçek izin plandan nerede ayrıldığını gör; izi değiştir ya da bağlantısını kaldır.',
  'help.guide.tour-origin-check.title': 'Bir turun nereden geldiğini gör',
  'help.guide.tour-origin-check.result':
    'Turun nereden ve ne zaman geldiğini, o zamandan beri değişip değişmediğini öğrenirsin.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Kaydedilmemiş taslak korunur: “Turlar” sekmesini yeniden açtığında taslak geri yüklenir ve “Kaydedilmemiş taslak geri yüklendi” yazar. “Turlara dön” ve “Vazgeç”, değişiklikleri atmadan önce sana sorar.',
  'help.guide.tour-open-workspace.step.6':
    'Sol alttaki etiket haritayı değiştirir; başlangıçta “Harita” veya “Uydu” gelir. Bir tur açıkken turun türüne uygun haritaları, örneğin Topo veya Yürüyüş, ayrıca “Nokta koy” ve 3D gibi anahtarları sunar.',
  'help.guide.tour-draw-route.step.1':
    'Sol panelin üstündeki “Yeni tur planla”ya tıkla. Panel “Yeni tur”a dönüşür; başka bir tür seçmezsen doğa yürüyüşü olur.',
  'help.guide.tour-draw-route.tip.3':
    'Bir taslakta kaydedilmemiş değişiklik varsa “Tur ekle” menüsündeki “Yeni tur planla” önce sorar: “Yeni bir tur başlatılsın mı?”, seçenek “Vazgeç ve başla”.',
  'help.guide.tour-type-profile.step.4':
    'Rota profile göre yeniden planlanır ve sağdaki “Tur özeti” mesafesini ve süresini gösterir.',
  'help.guide.tour-edit-points.step.3':
    'Sırayı değiştirmek için bir satırın üzerine gel ve sol kenarında beliren tutamaçtan sürükle.',
  'help.guide.tour-shaping-points.goal': 'Durak eklemeden rotayı başka bir yola kaydır.',
  'help.guide.tour-shaping-points.result': 'Rota sürüklediğin yerden geçer, duraklar da eskisi gibi numaralı kalır.',
  'help.guide.tour-loop-reverse.tip.3':
    'Bir doğa yürüyüşünde yanlarındaki “Başlangıçtan döngü rotası”, seçtiğin uzunlukta döngü yürüyüşleri arar.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Elle çizilen bölümü hiçbir yönlendirici kontrol etmedi: su, özel arazi veya uçurum üzerinden geçebilir.',
  'help.guide.tour-trip-places.step.4':
    'Satırında adın altında “Gezinin yeri” yazar. “Diğer işlemler”deki “Yerden ayır” noktayı korur ama bağlantıyı kaldırır.',
  'help.guide.tour-details-times.step.2': '“Detaylar” altında bir “Açıklama” yaz, varsa “Web sitesi” ekle.',
  'help.guide.tour-save.goal': 'Çizdiğin turu seyahatte sakla.',
  'help.guide.tour-save.result': 'Tur seyahate kaydedilir ve bir güne eklenmeye hazırdır.',
  'help.guide.tour-edit-saved.tip.2':
    'İçe aktarılan GPX veya KML izi, incelemek için “GPX turu” olarak açılır. Oradaki “Düzenlenebilir sürüm planla” değiştirebileceğin bir tur oluşturur.',
  'help.guide.tour-summary-profile.step.4':
    'Başlığın yanındaki ok olan “Yükseklik profilini daralt” profili gizler; yeniden göstermek için tekrar tıkla.',
  'help.guide.tour-list-manage.step.2':
    'Bir turun üzerine gel ve seyahatin günlerini açmak için satırındaki yuvarlak artıya, yani “Güne ekle”ye tıkla.',
  'help.guide.tour-delete.title': 'Bir turu sil',
  'help.guide.tour-saved-elsewhere.title': 'Tur başka yerde kaydedildiğinde',
  'help.guide.tour-saved-elsewhere.result': 'Sen vazgeçmeyi seçmedikçe hiçbir değişiklik kaybolmaz.',
  'help.guide.tour-import-gpx.title': 'Bir GPX, KML veya KMZ dosyasını tur olarak içe aktar',
  'help.guide.tour-import-gpx.tip.2':
    'Dosyadaki her iz veya rota ayrı bir tur olur. İzler hiçbir zaman birleştirilmez.',
  'help.guide.tour-view-import.step.2':
    'Sol sütun turu “GPX turu” olarak gösterir: mesafesi, yükseklikleri ve kayıtlı süresiyle “Tur özeti” ve altında yükseklik profili. Harita da çizgisini gösterir.',
  'help.guide.tour-plan-from-import.step.1':
    'İçe aktarılan turu “Turlar” sekmesinde aç. Soldaki “Düzenlenebilir sürüm” kartında “Düzenlenebilir sürüm planla”ya tıkla.',
  'help.guide.tour-plan-from-import.result':
    'Turun artık sürükleyebileceğin ara noktaları var ve “Köken” alanında “Yeniden planlandı, kayıtlı iz korundu” yazar.',
  'help.guide.tour-restore-recorded.result': 'Tur yeniden bir GPX turu olur ve kaydedildiği çizgiyi gösterir.',
  'help.guide.tour-take-over.step.6': '“Al”a tıkla.',
  'help.guide.tour-import-wanderer.step.2':
    '“Parkur ara” alanına yaz. “Bu harita alanında ara” yalnızca haritanın görünen kısmındaki patikaları gösterir.',
  'help.ctx.trip-tour-map.title': 'Tur haritası',
  'help.guide.tour-map-layers.goal':
    'Tur türüne en uygun haritada planla: tırmanışlar için eş yükselti çizgileri, işaretli patikalar veya bisiklet rotaları ya da hava görüntüleri.',
  'help.guide.tour-along-search.title': 'Bir tur boyunca yerler bul',
  'help.guide.tour-along-search.tip.1':
    'Rotayı, türleri veya mesafeyi değiştirdikten sonra “Yeniden ara” vurgulanır ve listenin rotanın önceki haline göre bulunduğunu belirtir. Listeyi güncellemek için ona tıkla.',
  'help.guide.tour-along-add-stop.step.4':
    'Rota o yerden geçecek şekilde yeniden planlanır ve “Tur boyunca” turun ne kadar mesafe ve süre kazandığını gösterir. Aynı satırdaki “Geri al” durağı yeniden kaldırır.',
  'help.guide.tour-3d-terrain.step.2':
    'Rota eğime göre renklenir. Rotayı turun kendi renginde çizmek için alttaki satırda “Eğim”e tıkla; eğimleri yeniden görmek için tekrar tıkla.',
  'help.guide.tour-3d-flyover.title': 'Bir tur boyunca uç',
  'help.guide.tour-3d-flyover.tip.2':
    'Uçuş, rota boyunca tüm manzara yüklendikten sonra başlar; böylece yarı yolda harita verisi yüklemek için durmaz. Ne kadarının yüklendiğini görmek için halkanın üzerine gel.',
  'help.guide.tour-map-overlays.result':
    'Pistler veya deniz işaretleri haritanın üzerine çizilir ve gösterge bunları açıklar.',
  'help.ctx.trip-tour-stages.bullet.3':
    '“Tur özeti”, “Etaplar” altında her etabı başladığı duraktan bittiği durağa kadar listeler. Bir etaba tıklamak son durağını seçer ve yükseklik profilinde o noktayı işaretler.',
  'help.guide.tour-multi-day.step.4':
    '“Ara noktalar” artık “Etap 1” ve “Etap 2” olarak bölünür; her birinde mesafesi ve süresi görünür. Bir etabı bitiren durakta ay simgesi bulunur.',
  'help.guide.tour-stages-on-days.title': 'Çok günlü bir turu seyahatin günlerine yerleştir',
  'help.guide.tour-stages-on-days.tip.1':
    'Seyahat son etaptan önce bitiyorsa seçenek, sığan son etabın hangisi olduğunu söyler. Ondan sonraki etaplara gün atanmaz.',
  'help.ctx.trip-tour-hike.bullet.2':
    '“Ara noktalar” durakları sırayla listeler. “Nokta ekle” baştan açıktır, yani haritaya tıklamak bir sonraki noktayı koyar; yanındaki “Gezi yerleri” seyahatin bir dağ evini veya otelini durağa dönüştürür.',
  'help.guide.tour-hike-plan.step.2':
    '“Tur türü”nü aç ve “Doğa yürüyüşü”nü seç: yaya, belirlediğin zorluk sınırları içinde.',
  'help.guide.tour-hike-plan.tip.3':
    'Zorluğun altındaki “Rota seçimi” rota tercihlerini belirler: “Dik yokuşlardan kaçın”, “Merdivenlerden kaçın” ve “Feribotlardan kaçın”. Başka yol yoksa rota yine de oradan geçer.',
  'help.guide.tour-hike-trail-details.step.5':
    'Aynı rotayı, asfalttan doğal zemine ve kayaya kadar üzerinde yürüdüğün zemine göre görmek için “Zemin”e tıkla.',
  'help.guide.tour-hike-round.step.2':
    '“Döngü yürüyüşü” kartı haritanın üzerinde açılır. Başlangıç noktasını “Nereden” altında kontrol et ve istediğin “Mesafe”yi yaz. Yanındaki etiket, bir döngü yürüyüşünün alabileceği uzunluk aralığını gösterir.',
  'help.guide.tour-hike-compare-ways.title': 'Bir yürüyüşün bir kesimi için diğer yolları karşılaştır',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Yönlendirici başka yol bilmiyorsa kart bunu belirtir. Yönlendirici seçtiğin yolu izleyemiyorsa kesim olduğu gibi kalır ve kart bunu söyler.',
  'help.guide.tour-ferrata-add.step.5':
    'Sağdaki “Tur özeti” derecesiyle birlikte “Via ferrata rotası” rozetini gösterir; düzenleyicinin başlığı da “Rota bir via ferrata üzerinden geçiyor” uyarısını verir.',
  'help.guide.tour-run-plan.step.1': '“Yeni tur planla”ya tıkla, “Tur türü”nü aç ve “Koşu”yu seç.',
  'help.guide.tour-run-plan.tip.3': 'Mesafeler mil cinsindeyse tempo da mil başınadır.',
  'help.guide.tour-run-ways.tip.1': 'Buradaki hiçbir şey koşunun rotasını ya da süresini değiştirmez.',
  'help.ctx.trip-tour-walk.bullet.5':
    "“Bu seyahatin turları”ndaki “Tur ekle”, Google Haritalar'dan paylaşılan bir yürüyüş rotasını içe aktarır. “Plan” sekmesinde, günden açılan bir yürüyüşte duraklarını o gün için işaretleyebilirsin.",
  'help.guide.tour-walk-plan.step.6':
    'Sağdaki “Tur özeti”nde “Tahm. süre”, “Duraklar” ve bu ikisinin toplamı olan “Planlandı” görünür. Yürüyüşü saklamak için sol sütunun altındaki “Kaydet”e tıkla.',
  'help.guide.tour-walk-sights.step.2':
    'Tema “Ne aranacak” alanını doldurur. Türleri açıp kapatmak için alanı aç ve “Rotaya bu mesafe içinde” altında ne kadar uzağa bakılacağını seç.',
  'help.guide.tour-walk-day-times.title': 'Günün varış saatlerini ve çalışma saatlerini gör',
  'help.guide.tour-walk-day-times.tip.3':
    "Çalışma saatleri OpenStreetMap'ten ya da durağın ait olduğu seyahat yerinden gelir; yanlarındaki etiket hangisi olduğunu söyler. Gitmeden önce kontrol et.",
  'help.guide.tour-walk-google-import.step.4':
    '“Yürüyüş olarak yükle”ye tıkla. TREK duraklar arasındaki yaya yolunu kendisi planlar. Yürüyüşü saklamak için “Kaydet”e tıkla.',
  'help.guide.tour-walk-check-off.step.2':
    '“Yürüyüşün durakları”na kaydır. Her durakta ne kadar kalacağın ve yürüyüşün başlangıç saati varsa oraya ne zaman varacağın görünür.',
  'help.ctx.trip-tour-bike.summary':
    '“Turlar” sekmesinde düzenleyicide açık bir bisiklet turu: hangi profile göre yönlendirildiği, sürüş süresi, rotanın hangi zeminde ilerlediği ve dağ bisikleti turlarında patikalarının ne kadar zor derecelendirildiği.',
  'help.guide.tour-bike-profile.step.2': '“Tur türü” alanını aç ve “Bisiklet turu”nu seç.',
  'help.guide.tour-bike-profile.tip.3':
    'Bir noktanın yakınında bisiklete uygun yol yoksa panelde “No way for bikes reaches point N” yazar. Noktayı taşı ya da öncesindeki noktada “Diğer işlemler”i açıp “Sonraki bölümü elle çiz”i seç.',
  'help.guide.tour-bike-surfaces.step.4':
    '“Yol türü” altında rotanın nerelerde ilerlediğini görmek için “Tarla veya orman yolu” ya da “Trafikli yol” gibi bir satıra tıkla.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Bisiklet turunu düzenleyicide aç ve “Profil”in MTB olduğundan emin ol. Patika dereceleri yalnızca bu profilde okunur.',
  'help.ctx.trip-tour-ski.title': 'Kayak ve kış turları',
  'help.guide.tour-ski-plan.goal':
    'Haritada işlenmiş pistler, liftler ve parkurlar boyunca bir gün pist kayağı, kayaklı koşu turu, kayak turu ya da kar ayakkabısı yürüyüşü planla.',
  'help.guide.tour-ski-plan.tip.2':
    "“Branş” yanındaki bilgi simgesi TREK'in kayak turlarıyla ne yaptığını anlatır. Orada ya da başka hiçbir yerde kar, çığ veya pistlerin, liftlerin ve parkurların açık olup olmadığı hakkında bir bilgi yoktur.",
  'help.guide.tour-ski-options.step.3':
    '“Tercih et” altında “En hızlı”, “En çok kayak” veya “En kolay”ı seç. “Tempo” altında “Rahat”, “Normal” veya “Sportif”i seç: yönlendiricinin her pist için hesapladığı süreyi değiştirir.',
  'help.guide.tour-ski-fix-leg.goal': 'Kırmızı bir bölümü tek tıkla planla ya da düz çiz.',
  'help.guide.tour-ski-fix-leg.result':
    'Artık kırmızı bölüm kalmaz: her biri pistleri izler ya da noktaları arasında düz gider.',
  'help.guide.tour-ski-summary.tip.3':
    'Kayıtlı tur kaydedildiği gibi açılır. Güncel pist verisine göre yeniden planlamak için bir noktayı taşı veya bir seçeneği değiştir.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Anahtar soluk kalıyor ve “Pistleri görmek için yakınlaştır” yazıyorsa kayak alanına yakınlaş.',
  'help.guide.tour-ski-import.step.3':
    '“Branş”ı seç; “Kayaklı koşu” için ayrıca “Teknik”i seç. Bunu yapana kadar pencerede “Choose a discipline to import the track as ski” yazar.',
  'help.ctx.trip-tour-paddle.title': 'Kürek turları',
  'help.guide.tour-paddle-setup.title': 'Bir kürek turu planla',
  'help.guide.tour-paddle-setup.step.7':
    '“Nokta ekle”nin açık olduğunu kontrol et, sonra haritaya tıkla: önce suya indiğin yer, sonra güzergâhtaki noktalar ve çıkış yerin.',
  'help.guide.tour-paddle-water-route.step.1':
    'Elle çizilen bir bölümde noktasının altında uzunluğuyla birlikte “Elle çizildi, rotalanmadı” yazar. TREK çizgiyi senin çizdiğin gibi korur.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Planlanmamış bir bölüm varken kaydedemezsin. Önce bölümü suyun üzerinde planla ya da elle çiz.',
  'help.guide.tour-paddle-portage.step.5':
    '“Çıkış ve giriş” altına karaya çıkmak, boşaltmak ve tekrar suya koymak için gereken dakikayı yaz. Boş bırakırsan TREK 10 dakika hesaplar.',
  'help.guide.tour-paddle-lock.step.2':
    '“Bu noktaya kilit ekle”yi seç. Noktanın altında “Süre eksik” işaretli bir “Kilit” kartı belirir.',
  'help.guide.tour-paddle-time.goal':
    'Suyun, taşımanın, kilitlerin ve molaların toplam süreyi nasıl oluşturduğunu gör ve kendi değerlerini belirle.',
  'help.guide.tour-paddle-time.tip.3':
    'Molalar ve kendi planlanan toplamın “Detaylar” altında ayarlanır. Planlanan toplam girildiğinde kart, tahminin yanında “Planladığın toplam süre”yi gösterir.',
  'help.guide.tour-paddle-wind.tip.1':
    'Tahmin yalnızca önümüzdeki 16 gün için vardır. Daha ilerideki bir gün için tahminin hangi tarihten itibaren alınabileceğini, geçmiş bir gün için ise günün geçtiğini söyler.',
  'help.guide.tour-paddle-checklist.step.2':
    "Altındaki satır verinin ne kadar güncel olduğunu gösterir: OpenStreetMap için “OSM veri tarihi”, TREK'in veriyi ne zaman okuduğu için “Alınma tarihi”, tüm rotayı kapsamadığı yerler için “Engel verisi”.",
  'help.guide.tour-paddle-checklist.tip.5':
    "Kontrol listesi bir güvenlik ya da hukuki onay değildir. Senin kararın, OpenStreetMap'te kayıtlı bir yasağı veya özel araziyi ortadan kaldırmaz.",
  'help.guide.tour-paddle-track-marks.step.5':
    '“Taşıma”ya tıkla, sonra çizgide karaya çıktığın ve tekrar suya girdiğin yerlere tıkla.',
  'help.ctx.trip-tour-horse.summary':
    "At gezisi hiçbir zaman otomatik yönlendirilmez. OpenStreetMap'in bildiği işaretli at yolu bölümlerinden oluşur; bu bölümler elle çizdiğin kesimlerle birleştirilir ya da gezi kaydettiğin gibi saklanır.",
  'help.guide.tour-horse-plan.step.1':
    'Ata bineceğin bölgeyi haritada görünür hale getir, sonra sol sütunun üstündeki “Yeni tur planla”ya tıkla.',
  'help.guide.tour-horse-plan.tip.1':
    "Bir at rotasında olmak, o rotada ata binme izni anlamına gelmez. “At erişimi” yalnızca OpenStreetMap'te etiketlenen bilgiyi gösterir. Her zaman yerindeki işaretlere uy.",
  'help.guide.tour-horse-gap.step.2': '“Elle çizilen bir bölümle bağla”yı aç. Boşluk düz ve kontrolsüz çizilir.',
  'help.guide.tour-horse-recorded.goal':
    'GPS cihazında veya uygulamada kaydettiğin bir sürüşü içe aktar ve bindiğin gibi sakla.',
  'help.guide.tour-horse-recorded.tip.3':
    'Aynı önizlemeyi açmak için dosyayı “Turlar” sekmesinde herhangi bir yere de bırakabilirsin.',
  'help.guide.create-trip.tip.3':
    '“Seyahat arkadaşları” altında burada zaten hesabı olan kişileri ekleyebilirsin. Seyahat oluşturulur oluşturulmaz seyahatin üyesi olurlar.',
  'help.guide.trip-reminder.step.1':
    'Seyahatin kartındaki kalem simgesine tıkla. Yeni bir seyahatte aynı bölüm “Yeni Seyahat” formunda yer alır.',
  'help.guide.company-holidays.tip.2':
    'Tam gün şirket tatili, o güne önceden girilmiş tüm izinleri siler; böylece kimse o gün için izin hakkından harcamaz.',
  'help.guide.half-company-holiday.tip.2':
    'Temizlemek için güne aynı ayarlarla tekrar tıkla ya da tam gün şirket tatili yapmak için “Yarım gün” kapalıyken tıkla.',
  'help.guide.edit-holiday-calendar.step.1':
    '“Ayarlar”ı aç ve takvimi “Resmi Tatiller” veya “Okul tatilleri” altında bul.',
  'help.guide.person-color.goal': 'Kendine ya da birlikte plan yaptığın birine daha kolay ayırt edilen bir renk ver.',
  'help.guide.answer-fusion-request.tip.2': 'İkinizden biri birleşmeyi sonradan ayırabilir; kayıtların korunur.',
  'help.guide.log-for-partner.tip.2': 'Karşı taraf değişikliği anında görür ve “Hakediş” satırı hemen güncellenir.',
  'help.guide.country-places.title': 'Bir ülkedeki tüm yerleri gör',
  'help.guide.tour-activity-stats.step.1':
    'Haritanın altındaki panelde “İstatistikler” ve “Yapılacaklar Listesi”nin yanındaki “Turlar” sekmesini aç.',
  'help.guide.tour-activity-stats.tip.2':
    'Gerçekte izlediğin izi turun ayrıntısındaki “Gerçek iz ekle” ile bağla; burada planlanan değerlerin yerini kaydedilen değerler alır. Birkaç güne yayılan bir tur bir kez sayılır.',
  'help.ctx.collections.bullet.7':
    'Saklanan turlar: bir seyahatten sakladığın turlar listenin ilk satırlarında yer alır; zorluk derecesi, türü, geldiği seyahat ve ölçüleriyle birlikte. “Bir geziye ekle” bunlardan yeni bir tur oluşturur, çöp kutusu simgesi turu listeden çıkarır.',
  'help.guide.move-to-list.title': 'Yerleri başka bir listeye taşı veya çoğalt',
  'help.guide.copy-to-trip.tip.2': 'Seyahatte zaten olan bir yer atlanır ve TREK kaç yerin atlandığını söyler.',
  'help.guide.accept-list-invite.tip.2':
    'Üyeleri görmek için listenin üstündeki “Paylaşılan”a tıkla. Listeden tekrar çıkmak için oradaki “Listeden ayrıl”ı kullan.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Bir listede saklanan turdan, ara noktalarıyla ya da ara noktaları olmadan, seyahatlerinden birinde yeni bir tur oluştur.',
  'help.guide.tour-collection-add-to-trip.result':
    'Pencere, turun artık o seyahate ait olduğunu bildirir. “Geziyi aç” seni oraya götürür, “Kapat” ise “Koleksiyonlar”da bırakır.',
  'help.guide.tour-collection-manage.tip.3':
    'Saklanan turlar yalnızca kendi listelerinde görünür, “Tüm kayıtlılar”da görünmez.',
  'help.guide.search-journey.step.3':
    'Oraya kaydırmak için bir güne tıkla ya da o günün girdilerini listeleyip birini seçmek için okuna tıkla.',
  'help.guide.journey-map-layers.goal': 'Plan ile gerçekte olanı karşılaştır ve katmanları aç ya da kapat.',
  'help.guide.journey-keep-route.goal':
    "Bir günün Dawarich'teki gerçek rotasını journey haritasına ekle ve orada kalıcı olarak sakla.",
  'help.guide.journey-day-stays.goal': "Dawarich'in kaydettiği durakları tek tek girdiye dönüştür.",
  'help.guide.journey-take-over-day.goal':
    'Bir günün duraklarını tek adımda taslak girdilere ya da tek bir gün raporuna dönüştür.',
  'help.guide.journey-auto-prepare.title': 'TREK kaydedilen günlerini senin için hazırlasın',
  'help.guide.photo-location.title': 'Girdileri fotoğraflarının çekildiği yere yerleştir',
  'help.ctx.settings-about.summary':
    "TREK'in ne olduğu, bu sunucunun çalıştırdığı sürüm ve projeyi nerede bulacağın: dokümantasyon, hata bildirme yeri ve projeyi destekleme yolları.",
  'help.guide.startup.tip.2': 'Kapattığın bir eklentiye ait başlangıç sekmesi seçiliyse bunun yerine plan açılır.',
  'help.guide.web-push-device.title': 'Bu cihazda anlık bildirim al',
  'help.guide.connect-airtrail.tip.1': 'Kart yalnızca yönetici AirTrail eklentisini açtığı sürece görünür.',
  'help.guide.connect-dawarich.tip.1':
    "TREK yalnızca girdi, yer ve ülke önerir; sen onaylamadıkça hiçbir şey eklenmez ve Dawarich'e hiçbir şey geri yazılmaz.",
  'help.guide.tour-connect-wanderer.tip.1':
    "Kart yalnızca yönetici “Turlar” altında wanderer'a izin verdiği sürece görünür.",
  'help.guide.tour-wanderer-watch.tip.1':
    'Bir ipucu turu hiçbir zaman değiştirmez. Gerçekte neyin değiştiğini turun kaynak denetimi gösterir.',
  'help.guide.api-keys.tip.3':
    'Anahtarı Authorization: Bearer veya X-API-Key olarak /api/v1 adresine gönder. Bir hesapta en fazla 10 anahtar olabilir.',
  'help.guide.plugin-settings.step.2':
    '“Eklenti etkinliği”, bir eklentinin senin adına yaptığı tüm işlemleri en yenisi başta olacak şekilde listeler. “Yenile” en son işlemleri yükler.',
  'help.ctx.admin-github.bullet.3':
    'Hakkında: Ko-fi, Buy Me a Coffee, Discord, “Hata Bildir”, “Özellik İsteği” ve Wiki.',
  'help.guide.default-user-settings.goal':
    'Kimse “Ayarlar”ı açmadan her hesaba uygun birimleri, renk modunu ve para birimini ver.',
  'help.guide.default-map.step.3':
    "Her alan, alandan çıktığında kaydedilir. Alan adının yanındaki sıfırlama bağlantısı TREK'in varsayılan değerini geri getirir.",
  'help.guide.own-routing-engine.tip.2':
    'Yalnızca kendi rota motorun tanımlıysa herkese açık Valhalla da kullanılmaz. Alanın yanındaki sıfırlama bağlantısı alanı yeniden boşaltır.',
  'help.guide.admin-passkeys.step.1':
    '“Ayarlar” sekmesinde “Passkey ile oturum açma” altında “Passkey ile oturum açmayı etkinleştir”i aç.',
  'help.guide.storage-backends.step.4':
    'Üstteki “Sağlık”, bir ayna hedefine yapılan başarısız yazmaları listeler. “Kaydedilmiş kopya hatası yok” yazıyorsa her şey çalışıyordur.',
  'help.guide.channels-instance.tip.3':
    "Web anlık bildirimleri için HTTPS gerekir. iPhone ve iPad'de kullanıcıların önce TREK'i Ana Ekran'a eklemesi gerekir.",
  'help.guide.notification-defaults.step.1':
    '“Bildirimler” sekmesinde en alttaki “Kullanıcılar için varsayılanlar”a kaydır. Her satır bir olaydır, her sütun bir kanal.',
  'help.ctx.notifications.bullet.1':
    'Sağ üstteki zil, henüz okumadığın bildirimleri sayar. En yeni on bildirim için zile, bu sayfa için de zilin altındaki “Tüm bildirimleri göster”e tıkla.',
  'help.guide.read-notifications.step.2':
    'Panel en yeni on bildirimini listeler. Her birinde kimin neyi nerede yaptığı yazar; okunmamışların arka planı renklidir.',
  'help.guide.filter-notifications.step.2': 'Panelin altındaki “Tüm bildirimleri göster”e tıkla.',
  'help.guide.mark-notifications-read.tip.1': 'Bir bildirimi kendi düğmesinden açmak da onu okundu olarak işaretler.',
  'help.guide.delete-notifications.tip.2':
    'Silinen bir bildirim geri getirilemez. Bir bildirimi silmeden gizlemek için onu okundu olarak işaretle ve “Okunmamış” filtresini kullan.',
  'help.guide.notification-settings.tip.2':
    'Seyahat başına ayrı ayar yoktur: bir anahtar tüm seyahatlerin için geçerlidir.',
  'help.guide.link-journal.title': 'Seyahate bir günlük bağla',
  'help.guide.link-journal.tip.2': 'Bundan sonra erişim verdiğin kişiler günlüğü kendi Journey listelerinde de görür.',
  'help.ctx.trip-places.bullet.8':
    "Dawarich bağlıysa listenin üstündeki “Dawarich’ten”, seyahat sırasında Dawarich'in kaydettiği durakları gösterir. “Yer olarak ekle” bir durağı yere dönüştürür, “Ziyaret ettiğim bir yer değil” ise durağı listeden kaldırır.",
  'help.guide.dawarich-stays.step.4':
    'Gerçek bir ziyaret olmayan bir durağı kaldırmak için yanındaki x olan “Ziyaret ettiğim bir yer değil”e tıkla. Listenin altındaki “Show … already dealt with” eklediğin veya kaldırdığın durakları gösterir. “Geri koy” kaldırılan bir durağı listeye geri getirir.',
  'help.guide.leave-stop-off-route.tip.1':
    'Bu seçenek yalnızca koordinatı olan duraklarda bulunur ve yalnızca o gün için geçerlidir: aynı yer başka bir günde yine rotaya dahil edilir.',
  'help.guide.move-booking-day.title': 'Bir rezervasyonu başka bir güne taşı',
  'help.guide.place-image-from-file.step.4':
    "Fotoğraf artık yerin resmidir. Resmi yeniden kaldırmak için köşesindeki küçük kırmızı X'e tıkla.",
  'help.guide.place-own-hours.step.2': '“Web sitesi”nin altında biliyorsan “Telefon” ve “E-posta” alanlarını doldur.',
  'help.guide.add-accommodation.tip.4':
    'Daha hızlı bir yol: günün başlığındaki +, ipucu “Güne ekle” olan düğmede “Konaklama ekle” seçeneği vardır. Günü, bu form zaten açık olarak açar.',
  'help.guide.confirm-stay-booking.goal':
    'Bir konaklamanın otel rezervasyonunu doğrudan günden onaylandı olarak işaretle.',
  'help.guide.map-whole-trip.tip.4':
    'Tüm seyahatin gösterilip gösterilmeyeceği hesabında seyahat başına saklanır, böylece seyahat başka bir tarayıcıda da aynı şekilde açılır.',
  'help.guide.tour-map-lines.step.3':
    'Gün sütununda turun yer aldığı bir günü aç; tur günün rotasının parçası olur: rota turun başladığı yere gider ve bittiği yerden devam eder.',
  'help.guide.car-stops.goal':
    'Kiralık bir arabaya ya da kendi arabana alış yerini, iade yerini ve arada durduğun yerleri ekle.',
  'help.guide.car-stops.tip.1': 'Ayrı bir kiralık araç türü yoktur: kiralık araba da kendi araban da “Araba”dır.',
  'help.guide.transport-details.result':
    '“Plan” yolculuğun gününde açılır, yolculuğun çizgisi haritada çizilir ve satırındaki rota simgesi açık olur.',
  'help.guide.export-transports-csv.step.2':
    '“Görünüm seçenekleri”nden sonraki, ipucu “Tablo olarak dışa aktar (CSV)” olan tablo simgesine tıkla.',
  'help.guide.group-sort-bookings.title': 'Rezervasyonları grupla ve sırala',
  'help.guide.group-sort-bookings.tip.2':
    '“Zaman çizelgesi”nde aynı düğmede “Her tür için ayrı şerit” ve “Diğer sekmeyi de göster” bulunur.',
  'help.guide.booking-on-map.result':
    'Ayrıntı kapanır ve “Plan” sekmesi rezervasyonun gününde, yeri haritada seçili olarak açılır.',
  'help.guide.export-bookings-csv.step.1':
    'Sekmenin yalnızca bir bölümünü dışa aktarmak için önce “Ara” veya “Filtrele” ile daralt. Dosya, sekmede gösterilenlerin tamamını içerir.',
  'help.guide.import-booking-file.tip.4':
    'Onayı okumak için internet bağlantısı gerekir. Çevrimdışıyken “İçe aktar” bunu bildirir; TREK yeniden çevrimiçi olunca tekrar dene.',
  'help.guide.arrange-packing-list.step.1':
    'Bir listenin başlık çubuğunun sol ucundaki, renk noktasından önce gelen tutamacı tut ve listeyi başka bir karta bırak. Vurgu renginde bir çerçeve hedef kartı gösterir ve liste, seyahatteki herkes için o kartın yerini alır.',
  'help.guide.count-packed-pieces.title': 'Bir şeyin birkaç parçasını paketle',
  'help.guide.count-packed-pieces.tip.2':
    '“Çanta Takibi” açıkken “Çantalar” kartındaki “Paketlendi” yalnızca sayılmış parçaları sayar.',
  'help.guide.packing-bags.tip.4':
    'Birkaç kişinin taşıdığı bir çantanın ağırlığı “Kişi başı” altında aralarında eşit olarak bölünür. Bu ağırlığın altı noktalı çizilidir ve üzerine geldiğinde bununla ilgili bir not gösterir.',
  'help.guide.expense-receipts.step.1':
    'Harcamanın satırının yanındaki kalem simgesine tıkla. Düzenleyici o harcama için açılır; altına yakın bir yerde “Fişler ve Faturalar” bulunur.',
  'help.guide.expense-receipts.tip.3':
    'Ekleme için internet bağlantısı ve dosya yükleme izni gerekir, çünkü fiş seyahatin dosyalarından biri olarak saklanır.',
  'help.guide.files-sync-settings.title': 'Belgeler için eşitleme yönünü seç',
  'help.guide.files-sync-settings.tip.1':
    'Bir yön her zaman açık kalır: açık kalan tek yöne tıklamak hiçbir şeyi değiştirmez.',
  'help.guide.manage-notes.title': 'Bir notu oku, sabitle ve düzenle',
  'help.guide.manage-notes.tip.1':
    '“Genişlet” menüde yalnızca notta metin varsa yer alır. “İş birliği”ni düzenleme izni olmayan üye yalnızca “Genişlet”i görür.',
  'help.guide.note-categories.step.5':
    '“Kaydet”e tıkla. Yeniden adlandırılan veya rengi değiştirilen bir kategorideki tüm notlar, tüm üyeler için aynı anda güncellenir. “İptal” değişikliklerini atar.',
  'help.guide.trip-chat.tip.5':
    'Sohbet en yeni mesajları ilk gösterir. Sohbetin üstündeki “Eski mesajları yükle” önceki mesajları getirir.',
  'help.guide.roadtrip-reorder.result':
    'Duraklar belirlediğin sırada durur; değiştirdiğin her günün mesafesi, sürüş süresi ve varış saatleri yeniden hesaplanır.',
  'help.guide.roadtrip-overnight.goal': 'Yolda kalacak bir yer bul ve geceyi rezervasyon olarak sürüşe ekle.',
  'help.guide.roadtrip-overnight.tip.2':
    'Rezerve edilmiş bir geceyi kartındaki “Düzenle”den tekrar “Mola”ya çevirmek, önce “Konaklama kaldırılsın mı?” sorusunu getirir. “Molaya çevir” geceyi, rezervasyonunu ve ona bağlı tüm harcamaları kaldırır, durağı ise sürüşte tutar.',
  'help.guide.roadtrip-stop-fill.tip.2': 'Durağın zaten sahip olduğu değeri seçersen durak varsayılan değerine döner.',
  'help.guide.roadtrip-bookings.tip.1':
    'Terminaldeki saat, giriş işlemleri için tarifeden daha erken ayarlanır: uçuş veya gemi seferi için bir saat, feribot için yarım saat, tren veya otobüs için on dakika.',
  'help.guide.roadtrip-google-import.step.2':
    "Google Haritalar'dan paylaştığın bir rotanın bağlantısını yapıştır ve “Önizleme”ye tıkla.",
  'help.guide.roadtrip-hazards.goal':
    'Sürüşünün çevresindeki hava durumu uyarılarını ve afet uyarılarını haritada gör.',
  'help.ctx.trip-tours.title': 'Planda turlar',
  'help.guide.tour-show-list.title': 'Seyahatin turlarını planda göster',
  'help.guide.tour-show-list.tip.2':
    'Henüz tur yok mu? Listenin üstündeki “GPX veya KML içe aktar” bir dosya içe aktarır, “Turlar” sekmesindeki “Yeni tur planla” ise yeni bir tur oluşturur.',
  'help.guide.tour-add-to-day.step.4':
    'Ya da satırı listeden sürükleyip sol sütunda bir güne bırak. İki durağın arasına bırakırsan tam oraya yerleşir.',
  'help.guide.tour-day-times.goal':
    'Bir turun ne zaman bittiğini ve o günün sonraki planıyla çakışıp çakışmadığını gör.',
  'help.guide.tour-day-times.tip.4':
    'Aynı menüdeki “Koleksiyona kaydet”, kartın “Koleksiyon” düğmesi gibi turu rotasıyla birlikte bir koleksiyonda saklar.',
  'help.guide.tour-remove-from-day.tip.2':
    'Bu menülerde ve kartta “Sil” yoktur. Tur, “Turlar” sekmesinde “Bu seyahatin turları” altındaki satırında bulunan çöp kutusuyla silinir.',
  'help.guide.tour-filter-list.tip.1':
    '“Rota sınırı”, rotanın izin verecek şekilde planlandığı en yüksek zorluktur; patikada ölçülen zorluk değildir.',
  'help.guide.tour-hide-on-map.step.3':
    'Herhangi bir tur gizliyken listenin üstündeki bir satırda kaç tur olduğuyla birlikte “Haritada gizli” yazar. “Tümünü göster” tüm turları tek seferde geri getirir.',
  'help.guide.tour-import-plan-tab.step.3':
    '“İçe aktarma önizlemesi” her izi, hiçbir şey kaydedilmeden önce gösterir. “Şu olarak içe aktar” altında türü seç (“Doğa yürüyüşü”, “Bisiklet turu” vb.), sonra “1 turu içe aktar”a tıkla.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Altında “Seyahat günleri” gelir: turun yer aldığı her gün için bir kutucuk, yükseklik profiliyle birlikte ölçüler ve ardından geçerli oldukları ölçüde şunlar: şehir yürüyüşünün durakları, bir kürek turunun kontrolleri ve rüzgârı, “Gerçek iz”, “Paket listesi”, “Açıklama”, “Notlar”, “Köken” ve “Dosya”.',
  'help.guide.tour-detail-read.step.4':
    '“Seyahat günleri”, turun yer aldığı her gün için tarihiyle birlikte bir kutucuk gösterir. “Seyahatin hiçbir gününde değil” turun henüz planlanmadığı anlamına gelir.',
  'help.guide.tour-detail-read.tip.5':
    'Telefonda kart, okumak ve turu yanına almak için alttan bir sayfa olarak açılır.',
  'help.guide.tour-rename-colour.tip.1':
    'Ad ve renk seyahate aittir, bu yüzden seyahatteki herkes bunları görür. Bir turu başkaları için değiştirmeden yalnızca kendi haritanda gizlemek için “Turlar” listesindeki göz simgesini kullan.',
  'help.guide.tour-take-along.tip.1':
    "Dosya paylaşabilen bir cihazda GPX'in yanında “Paylaş” görünür ve aynı dosyayı doğrudan başka bir uygulamaya gönderir.",
  'help.guide.tour-copy-keep.step.2':
    'Kopya hemen açılır; adı, orijinalin adı ve ardından (kopya) şeklindedir. Kendi adını vermek için kalem simgesine tıkla.',
  'help.guide.tour-packing-link.title': 'Bir turu paket listesine bağla',
  'help.guide.tour-packing-link.tip.2':
    'Bölüm başlığındaki “Değiştir” turu başka bir listeye bağlar. O penceredeki “Bağlantıyı kaldır” bağlantıyı siler, liste olduğu gibi kalır.',
  'help.guide.tour-files.tip.1':
    'Bu dosyalar aynı zamanda seyahatin dosyalarıdır, bu yüzden “Dosya” sekmesinde de görünürler.',
  'help.guide.tour-activity-link.step.4': '“Gerçek” altında neyi ölçtüğünü kontrol et, sonra “Bağla”ya tıkla.',
  'help.guide.tour-activity-compare.step.1':
    'Turun kartını aç. “Plan ve gerçek”, planın “Mesafe”, “Toplam yükselme”, “Toplam alçalma” ve “Molalar dahil süre” değerlerini izin değerlerinin yanında, “Fark” ile birlikte gösterir.',
  'help.guide.tour-origin-check.goal':
    "Bir turun TREK'te mi çizildiğini yoksa içe mi aktarıldığını, hangi dosyadan geldiğini ve sonradan değişip değişmediğini öğren.",
  'help.ctx.trip-tour-planner.title': 'Turlar',
  'help.guide.tour-open-workspace.title': '“Turlar” sekmesinde yolunu bul',
  'help.guide.tour-open-workspace.step.7':
    "Sağ paneldeki bir tura tıkla. TREK'te planlanan tur düzenleyicide açılır. İçe aktarılan iz değiştirilmeden, incelemek için “GPX turu” olarak açılır.",
  'help.guide.tour-draw-route.step.2':
    'Turun başladığı yeri “Yer veya adres ara” alanına yaz ve sonucu seç. Harita oraya gider.',
  'help.guide.tour-draw-route.tip.4':
    'Kaydedilmemiş taslak korunur. Seyahatin “Turlar” sekmesini yeniden açtığında taslak geri yüklenir ve “Kaydedilmemiş taslak geri yüklendi” yazar.',
  'help.guide.tour-type-profile.tip.1':
    'Tür değişikliği geçmişte tek adım sayılır: panel başlığındaki “Nokta düzenlemesini geri al” eski türü ve rotasını geri getirir.',
  'help.guide.tour-edit-points.step.4':
    'Ya da satırdaki “Diğer işlemler”i (üç nokta) aç ve “Rota noktasını yukarı taşı” veya “Rota noktasını aşağı taşı”yı seç.',
  'help.guide.tour-shaping-points.step.1':
    'Haritada çizili rotaya, farklı gitmesini istediğin yerde tıkla. Orada küçük bir nokta belirir: bir şekillendirme noktası.',
  'help.guide.tour-loop-reverse.title': 'Gidiş dönüş yap ya da turu ters çevir',
  'help.guide.tour-loop-reverse.result': 'Başladığı yerde biten bir döngü ya da aynı turun ters yönde yapılması.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Hiçbir yolun ulaşmadığı bir noktada “Noktayı göster” düğmesi ve noktanın numarasıyla bir uyarı görünür. Noktayı bir yola taşı ya da ona giden bölümü elle çiz.',
  'help.guide.tour-trip-places.tip.1': 'Turda zaten olan bir yer “Turda” olarak işaretlenir ve iki kez seçilemez.',
  'help.guide.tour-details-times.step.3': '“Molalar” alanına 0:45 gibi bir süre gir. Süre tahmini süreye eklenir.',
  'help.guide.tour-save.step.1': '“Tur adı” alanına bir ad yaz. Ad olmadan “Kaydet” soluk kalır.',
  'help.guide.tour-edit-saved.title': 'Kaydedilmiş bir turu değiştir',
  'help.guide.tour-edit-saved.tip.3':
    'Panel başlığındaki “GPX indir” ve “Bir koleksiyonda sakla”, değişiklikler kaydedildikten sonra çalışır.',
  'help.guide.tour-summary-profile.tip.1': 'Tüm özeti daraltmak için kartın başlığına tıkla.',
  'help.guide.tour-list-manage.step.3': 'Günü seç. Tur o güne eklenir ve satırında gün görünür.',
  'help.guide.tour-delete.goal': 'Bir turu seyahatten kalıcı olarak kaldır.',
  'help.guide.tour-saved-elsewhere.goal':
    'Sen turu değiştirirken başka biri turu kaydettiğinde ne olacağına karar ver.',
  'help.ctx.trip-tour-import.title': 'Turları içe aktarma',
  'help.guide.tour-import-gpx.goal':
    "Bir GPS saatinden, bir uygulamadan veya Google Earth'ten gelen izi, hiçbir şey kaydedilmeden önce kontrol ederek seyahatin turuna dönüştür.",
  'help.guide.tour-import-gpx.tip.3': 'Seyahatte zaten olan bir iz “Zaten seyahatte” olarak soluk görünür ve atlanır.',
  'help.guide.tour-view-import.step.3': 'Sol üstteki ok olan “Turlara dön” görünümü yeniden kapatır.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK izden kontrol noktaları alır ve bunlar için rotayı yeniden hesaplar. Harita içe aktarılan izi noktalı, öneriyi düz çizgiyle çizer; kart uzunluklarını, “Within 50 m of the track” oranını ve “En büyük sapma”yı karşılaştırır.',
  'help.guide.tour-restore-recorded.title': 'Kaydedilen ize geri dön',
  'help.guide.tour-take-over.title': 'Başka bir seyahatten tur al',
  'help.guide.tour-take-over.tip.1':
    'Kopya ayrı bir turdur: henüz hiçbir güne eklenmemiştir ve orijinalde sonradan yapılan değişiklikler kopyayı, kopyadakiler de orijinali etkilemez. “Köken” alanında turun alındığı seyahat yazar.',
  'help.guide.tour-import-wanderer.step.3':
    "Bir patikaya tıkla. Patika haritada görünür; sütunda GPX dosyasının ölçtükleri, açıklaması ve wanderer'da herkese açık mı özel mi olduğu yer alır.",
  'help.ctx.trip-tour-map.summary':
    '“Turlar” sekmesinin ortasındaki harita, açık olan tur için: türüne uygun haritalar, üzerlerine eklenen pistler veya deniz işaretleri, rota boyunca yerler ve aynı turun gerçek araziyi gösteren 3D hali.',
  'help.guide.tour-map-layers.step.1':
    '“Turlar” sekmesini aç ve sağdaki “Bu seyahatin turları” altında bir tura tıkla. Tur planlayıcıda açılır; haritanın sol altındaki etiket bu tür tur için sunulan haritaları listeler.',
  'help.guide.tour-along-search.goal':
    'Planladığın turun rotasına yakın manzara noktaları, su kaynakları, dağ evleri ya da yemek yiyebileceğin yerler ara.',
  'help.guide.tour-along-search.tip.2':
    'Şehir yürüyüşünde listenin üstündeki dört tema senin için uygun türleri seçer.',
  'help.guide.tour-along-add-stop.result':
    'Tur artık o yerin yanından geçer; yeni mesafesi ve süresi “Tur özeti”nde görünür. Değişikliği korumak için turu kaydet.',
  'help.guide.tour-3d-terrain.step.3':
    "Sağdaki “Eğim dağılımı” etiketine tıkla. Etiket açılır ve turun ne kadarının %5'in altı, %5 ile %10 arası, %10 ile %18 arası, %18 ile %27 arası ve %27 ve üzeri eğimde olduğunu gösterir. Daraltılmışken en yüksek noktayı ve en dik kesimi gösterir.",
  'help.guide.tour-3d-flyover.goal':
    'Yürümeden, bisiklete binmeden ya da kaymadan önce turun tamamını baştan sona izle.',
  'help.guide.tour-3d-flyover.tip.3':
    'Uçuş duraklatılmışken yükseklik profili üzerinde ilerle; nokta o konuma gider. “Uçuşu oynat” oradan devam eder.',
  'help.guide.tour-map-overlays.tip.1':
    'Pistler haritalanmış veridir, canlı bir rapor değildir: neyin açık veya bakımlı olduğu, kar ya da çığ hakkında hiçbir şey söylemezler. Kayak alanından fazla uzaklaştırırsan anahtarda “Pistleri görmek için yakınlaştır” yazar.',
  'help.ctx.trip-tour-stages.bullet.4':
    '“Bu seyahatin turları” içinde çok günlü bir tur, etap sayısıyla birlikte bir ay simgesi gösterir. Bu düğme, “Etapları göster”, etap listesini her etabın bulunduğu gün ve “Tüm tur” toplamlarıyla açar.',
  'help.guide.tour-multi-day.step.5':
    '“Tur özeti” her etabı “Etaplar” altında listeler. Nerede bittiğini görmek için birine tıkla: son durağı seçilir ve yükseklik profilinde o nokta işaretlenir.',
  'help.guide.tour-stages-on-days.goal': 'Her etabı kendi gününe ya da turun tamamını tek bir güne yerleştir.',
  'help.guide.tour-stages-on-days.tip.2':
    '“Bu gün tüm tur”, turu zaten içeren bir günde soluktur. “Bu günden itibaren etaplar” orada da çalışır ve o gündeki tüm turun yerini alır.',
  'help.ctx.trip-tour-hike.bullet.3':
    '“Ara noktalar” kartının başlığında rota araçları bulunur: “Yönü ters çevir”, “Başlangıca dön” ve bir doğa yürüyüşünde “Başlangıçtan döngü rotası”. Bir duraktaki “Diğer işlemler”de “Sonraki bölüm için yolları karşılaştır” vardır.',
  'help.guide.tour-hike-plan.step.3': '“Tur adı” alanına bir ad yaz.',
  'help.guide.tour-hike-plan.tip.4':
    'Yürüme süresi yürüyüş tabelası kuralına (DIN 33466) göre hesaplanır ve molaları içermez. Molaları “Detaylar” içindeki “Molalar” alanına ekle; planlanan toplamda görünürler.',
  'help.guide.tour-hike-trail-details.result':
    'Yürüyüşün hangi kısımlarının nasıl derecelendirildiğini, neyden oluştuğunu ve haritada nerede olduğunu öğrenirsin.',
  'help.guide.tour-hike-round.step.3':
    '“Tur bul”a tıkla. “Döngü A”, “Döngü B” gibi seçenekler listede ve haritada, her biri kendi renginde görünür.',
  'help.guide.tour-hike-compare-ways.goal':
    'Bir yürüyüşün iki durak arasında hangi başka yolları izleyebileceğini gör ve bunlardan birini seç.',
  'help.guide.tour-hike-compare-ways.tip.3': '“İptal” kartı kapatır ve rotayı değiştirmez.',
  'help.guide.tour-ferrata-add.result':
    "Yürüyüş, OpenStreetMap'ten gelen via ferrata çizgisini izler. Tepeden devam etmek için haritaya tıkla. Yönlendirici yalnızca via ferrata'ya giden yolu ve sonrasındaki yolu planlar.",
  'help.guide.tour-run-plan.step.2':
    'Bir “Profil” seç: şehirde, parklarda ve nehir kıyılarında çoğunlukla asfalt yollar için “Koşu”, orman yolları ve doğal patikalar için “Patika koşusu”.',
  'help.guide.tour-run-plan.tip.4':
    '“Patika koşusu”, dağ yollarına (T2) kadar olan patikaları kullanır, daha zorlarını asla kullanmaz.',
  'help.guide.tour-run-ways.tip.2':
    'Rotanın daha çok doğal patika kullanması için “Profil”i “Patika koşusu”na, sağlam zeminde kalması için “Koşu”ya çevir.',
  'help.guide.tour-walk-plan.title': 'Duraktan durağa bir şehir yürüyüşü planla',
  'help.guide.tour-walk-plan.tip.1':
    'Durağın numarasının etrafındaki halka önemini gösterir: “Mutlaka görülmeli” için dolu, “İsteğe bağlı” için kesikli. Küçük bir kalkan “Korunuyor” durumundaki bir durağı işaretler.',
  'help.guide.tour-walk-sights.step.3':
    '“Tur boyunca ara”ya tıkla. Bir adın önündeki yıldız “Öne çıkan”ı, yani buradaki en bilinen yerlerden birini işaretler.',
  'help.guide.tour-walk-day-times.goal':
    'Yürüyüşün gününde her durağa ne zaman varacağını ve hangi yerlerin o saatte kapalı olduğunu öğren.',
  'help.guide.tour-walk-day-times.tip.4':
    'Bir günde iki yürüyüş: “Plan” sekmesinde ikisi arasındaki bölüme (“Ulaşım türünü değiştir”) tıkla ve “Toplu taşıma”yı seç. Arama, ilk yürüyüşün bittiği yerden ve bittiği saatten başlar; bir bağlantı sonraki yürüyüş başladıktan sonra varıyorsa seni uyarır.',
  'help.guide.tour-walk-google-import.tip.1':
    "Yalnızca yaya olarak planlanmış rota okunur. Paylaşmadan önce Google Haritalar'ı yürüyüş moduna al.",
  'help.guide.tour-walk-check-off.step.3':
    'Gördüğün bir durakta “Ziyaret edildi işaretle”ye, atlamak istediğin durakta “Atla”ya tıkla.',
  'help.ctx.trip-tour-bike.bullet.1':
    '“Tur türü” altındaki “Profil”, yönlendiricinin ne tür bir sürüş için planlama yaptığını belirler: “Tur”, “Yol”, Çakıl veya MTB. Altındaki satır yönlendiricinin neye baktığını anlatır; profili değiştirmek tüm rotayı yeniden planlar.',
  'help.guide.tour-bike-profile.step.3':
    "“Profil” altında “Tur”, “Yol”, Çakıl veya MTB'yi seç. Altındaki satır yönlendiricinin o profilde neye baktığını anlatır.",
  'help.guide.tour-bike-profile.tip.4':
    'Turun bir adı olana ve rota ile yükseklikler hesaplanana kadar “Kaydet” soluk kalır.',
  'help.guide.tour-bike-surfaces.result':
    'Harita seçtiğin satıra ait kesimleri işaretler ve rotanın hangi zeminleri kullandığını öğrenirsin. Turun kendisi değişmez.',
  'help.guide.tour-bike-mtb-grades.step.2':
    '“Zemin ve yollar” kartında “Parkur zorluğu (mtb:scale)” bölümünü oku: rotanın “S0, özel bir zorluk yok” seviyesinden “S4 ve üstü, uzman arazisi” seviyesine kadar payları.',
  'help.ctx.trip-tour-ski.summary':
    "“Turlar” sekmesinde “Kayak ve kış” türünde bir tur: pistlerde bir gün, kayaklı koşu turu, kayak turu, kar ayakkabısı yürüyüşü ya da kış yürüyüşü. Bölümleri OpenStreetMap'te haritalanmış pistleri, liftleri ve parkurları izler; pist yönlendiricisi bunları branşına ve sınırlarına göre planlar. Kaydedilmiş bir kayak izi de branşıyla birlikte içe aktarılır.",
  'help.guide.tour-ski-plan.step.1': '“Turlar” sekmesinde sol panelin üstündeki “Yeni tur planla”ya tıkla.',
  'help.guide.tour-ski-plan.tip.3':
    'Branşı sonradan değiştirirsen noktaların korunur ve bölümler o branşın kullandığı seçeneklerle yeniden planlanır.',
  'help.guide.tour-ski-options.step.4':
    'Anahtarları kullan: “Teleferik kullan”, “Freeride rotalarına izin ver”, “Gerekirse teleferikle in” ve “Tahmin edilen bağlantılardan kaçın”. “Kayaklı koşu” için “Yalnızca bakımlı parkurlar” ve “Yalnızca ışıklı parkurlar”, “Dağ kayağı” için “Pist kenarından tırman” da eklenir.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Yönlendiricinin planlayamadığı bölüm, noktasının altında nedeniyle birlikte kırmızı bir satır olarak görünür (örneğin “Only a lift you left out joins these points”) ve ilgili pist ya da lifti de gösterir.',
  'help.guide.tour-ski-summary.title': 'Bir kayak turunun pist rotasını oku',
  'help.guide.tour-ski-summary.tip.4':
    'Kartın alt kısmında kayak alanları ve turun planlandığı harita verisinin tarihi yazar.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Pistler yüklenmeyi bırakırsa anahtarda bir uyarı işareti görünür. Harita ve rotan yine de çalışır.',
  'help.guide.tour-ski-import.step.4': '“1 turu içe aktar”a tıkla.',
  'help.ctx.trip-tour-paddle.summary':
    "Nehir ya da gölde kayak, kano veya SUP turu. Teknesini ve suyunu belirtir, TREK'in verisi olan yerde suyu izler, taşıma ve kilit geçişlerini süreye ekler; kürek çektiğin günün rüzgârını ve yoldaki engellerle ilgili bilinenleri gösterir.",
  'help.guide.tour-paddle-setup.goal':
    'Kayak, kano veya SUP turu başlat ve neyle, hangi suda ve ne hızla kürek çekeceğini belirt.',
  'help.guide.tour-paddle-setup.tip.1':
    '“Tekne” “Diğer” olarak ayarlıysa önerilen bir hız yoktur. Bir hız gir, yoksa sudaki süre boş kalır.',
  'help.guide.tour-paddle-water-route.step.2':
    'Bir bölümü suda planlatmak için ondan önceki durağın üzerine gel ve üç nokta olan “Diğer işlemler”e tıkla.',
  'help.guide.tour-paddle-water-route.result':
    "Her bölüm ya suyu izler ya da bilerek elle çizilir; TREK'in planlayamadığı bölüm nedenini belirtir.",
  'help.guide.tour-paddle-portage.tip.1':
    'Bu kesimi yine de kürekle geçmek için noktada “Diğer işlemler”i tekrar aç ve “Bu bölümü yine kürekle geç”i seç. Bölüm yeniden elle çizilmiş bölüme döner.',
  'help.guide.tour-paddle-lock.step.3': 'Açmak için “Kilit” kartına tıkla.',
  'help.guide.tour-paddle-time.step.1':
    '“Süre tahmini” sol sütunda ara noktaların altındadır. Başlığındaki rozet, molalar dahil toplam süredir.',
  'help.guide.tour-paddle-time.result': 'Tahmin, girdiklerini hesaba katar ve hâlâ neyin eksik olduğunu belirtir.',
  'help.guide.tour-paddle-wind.tip.2':
    'Birkaç güne yayılan turda kart başlığında her gün için bir “Gün” etiketi görünür. O günü görmek için birine tıkla.',
  'help.guide.tour-paddle-checklist.step.3':
    "Girdiler rotayı izler: OpenStreetMap'ten gelen savaklar, kilitler, akıntılar, suya iniş yerleri ve erişim kuralları, ayrıca “Kendi planın” olarak işaretli kendi taşıma noktaların ve kilitlerin.",
  'help.guide.tour-paddle-checklist.result':
    'Rotadaki her girdi için bir karar verilmiştir ve güvenlik notunu okumuşsundur.',
  'help.guide.tour-paddle-track-marks.step.6': '“Kilit”e tıkla, sonra çizgide kilidin olduğu yere tıkla.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Düzenleyicide “Tur türü”nü “At gezisi” yaparsan sol sütunda “Binicilik rotaları” kartı belirir. “Harita görünümünde ara” harita görünümündeki rotaları listeler.',
  'help.guide.tour-horse-plan.step.2':
    '“Tur adı” altındaki “Tur türü” alanına tıkla ve “At gezisi”ni seç. “Binicilik rotaları” kartı “Ara noktalar”ın altında belirir.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK bir at gezisi için sürüş süresi hesaplamaz. Güne bir süre eklemek istersen “Detaylar” içindeki “Planlandı” alanına bir süre gir.',
  'help.guide.tour-horse-gap.step.3': '“Bölümü al”a tıkla. Anahtar açılana kadar düğme soluk kalır.',
  'help.guide.tour-horse-recorded.step.1':
    '“Bu seyahatin turları” içinde “Tur ekle”ye (+) tıkla, “GPX veya KML içe aktar”ı seç ve gezinin dosyasını seç.',
  'help.guide.dateless-trip.title': 'Tarihsiz bir seyahat planla',
  'help.guide.trip-reminder.step.2':
    '“Hatırlatıcı” altında 1, 3 veya 9 gün seç. Başka bir süre için “Özel”e tıkla ve 1 ile 30 arasında bir gün sayısı yaz.',
  'help.guide.upcoming-reservations.title': 'Sıradaki rezervasyonlarına git',
  'help.guide.half-company-holiday.title': 'Yarım gün şirket tatili işaretle',
  'help.guide.edit-holiday-calendar.step.2':
    "Yeni bir renk seçmek için renk karesine tıkla ya da yeni bir etiket yazıp Enter'a bas.",
  'help.guide.person-color.step.1': '“Kişiler” kartında adın önündeki renkli noktaya tıkla.',
  'help.guide.answer-fusion-request.title': 'Bir birleştirme isteğini yanıtla',
  'help.guide.log-for-partner.title': 'Birlikte plan yaptığın biri için gün gir',
  'help.guide.dissolve-fusion.title': 'Birlikte planlamayı bırak',
  'help.guide.country-places.goal':
    "TREK'in bir ülke için saydığı yerleri listele; orada neler yaptığını kontrol etmek ya da TREK'in yanlış ülkeye atadığı bir yeri bulmak için.",
  'help.guide.regions.tip.3':
    '“Yapılacaklar listesine ekle” bir bölge için de çalışır. Bölge, yapılacaklar listendeki bir ülkeyle aynı tarama desenini alır.',
  'help.guide.tour-activity-stats.step.2':
    'Soldaki iki etiketle bir dönem ve bir tür seç. “Dönem” şunları sunar: “Tüm zamanlar”, “Bu yıl”, “Son 12 ay” ve turun olduğu her önceki yıl. “Tür” rakamları tek bir tur türüne ya da “Tüm türler”e daraltır.',
  'help.guide.tour-activity-stats.tip.3':
    'Katılımcı belirtilen bir gün yalnızca onlar için sayılır; kimsenin belirtilmediği bir gün seyahatteki herkes için sayılır. Sekme canlı veri yükler ve internet bağlantısı gerektirir.',
  'help.guide.move-to-list.goal':
    'Yerleri listeler arasında taşıyarak ya da ikinci bir listeye kopyalayarak listelerini yeniden düzenle.',
  'help.guide.accept-list-invite.result':
    'Liste panelde “Paylaşılan” altında belirir ve yerleriyle birlikte açılır. Üyelerin yaptığı değişiklikler canlı olarak görünür.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Listeyi aç. Saklanan turlar, yerlerin üstündeki ilk satırlardır. Turdaki “Bir geziye ekle”ye ya da satırın kendisine tıkla.',
  'help.guide.tour-collection-manage.title': 'Saklanan turları bul ve kaldır',
  'help.guide.tour-collection-manage.result': 'Tur listeden kaldırılır ve kısa bir mesaj bunu doğrular.',
  'help.guide.entry-draft.title': 'Bir girdiyi taslak olarak tut',
  'help.guide.journey-map-layers.step.1':
    'Haritanın üstündeki katman çubuğunda “Plan”, “Kaydedilen”, “Kayıtlar” ve “Fotoğraf” yer alır, her birinin yanında sayısı vardır. Gizlemek veya göstermek için birine tıkla.',
  'help.guide.journey-keep-route.step.1': 'Günün başlığındaki Dawarich düğmesine, yani “Kaydı al”a tıkla.',
  'help.guide.journey-day-stays.step.1':
    "İncelenecek durakları olan bir günün sonunda “Dawarich'ten 4 durak” gibi bir satır ve zaman aralığı görünür. Durakları göstermek için ona tıkla.",
  'help.guide.journey-take-over-day.step.1':
    'Günün durak satırının sonundaki “Günü aktar”a ya da gün başlığındaki, kaç durağın beklediğini gösteren liste düğmesine tıkla.',
  'help.guide.journey-auto-prepare.goal':
    'Bir seyahat sürerken her günün duraklarının incelemeye hazır olmasını otomatik olarak sağla.',
  'help.guide.photo-location.goal': 'Her biri için yer aramadan girdileri haritaya yerleştir.',
  'help.ctx.settings-about.bullet.1': 'Bu sunucunun çalıştırdığı sürüm başlığın yanında gösterilir.',
  'help.guide.readability.tip.3':
    'Okunabilirlik “Deneysel” olarak işaretlidir. Bir şey yanlış görünürse varsayılan ayarlara dönmek için sekmenin altındaki “Varsayılanlara sıfırla”ya tıkla.',
  'help.guide.web-push-device.goal': 'TREK kapalıyken bile telefonunda veya bilgisayarında TREK bildirimlerini gör.',
  'help.guide.connect-airtrail.tip.2':
    'Anahtar şifrelenmiş olarak saklanır ve bir daha gösterilmez; alandaki noktalar kayıtlı bir anahtar olduğu anlamına gelir.',
  'help.guide.connect-dawarich.tip.2':
    "Düğmelerin altında kart, TREK'in en son ne zaman kontrol ettiğini ve Dawarich sürümünün nelerin sunulmadığını belirtir.",
  'help.guide.tour-connect-wanderer.tip.2':
    'Özel bir adreste çalışan sunucu için yöneticinin iç ağlara izin vermesi gerekebilir.',
  'help.guide.tour-wanderer-watch.tip.2':
    "“Şu zamana kadar duraklatıldı” wanderer'ın yanıt vermediği anlamına gelir. “Belirteç reddedildi” ise belirtecin başarılı bir bağlantı testine ya da yeni bir belirtece ihtiyacı olduğu anlamına gelir.",
  'help.guide.plugin-settings.result':
    'Eklenti senin ayarlarınla çalışır ve senin adına yaptığı her işlem “Eklenti etkinliği” altında listelenir.',
  'help.ctx.admin-defaults.bullet.3':
    "Ayarladığın bir alanın yanındaki sıfırlama bağlantısı TREK'in kendi varsayılanını geri getirir. Kullanıcının kendi ayarı her zaman bunların önüne geçer.",
  'help.ctx.admin-settings.bullet.5':
    'Tehlikeli Bölge: “JWT sırrını yenile” senin de aralarında olduğun tüm kullanıcıların oturumunu kapatır.',
  'help.guide.default-user-settings.step.1':
    '“Varsayılan Kullanıcı Ayarları” altında şunları seç: “Renk Modu” (Açık, Koyu veya Otomatik), “Sıcaklık Birimi”, “Mesafe Birimi”, “Saat Biçimi”, “Hafta başlangıcı”, “Görüntüleme para birimi” ve “Rezervasyon Kodlarını Bulanıklaştır”ın açık mı kapalı mı olacağı. Her seçim anında kaydedilir.',
  'help.guide.admin-passkeys.step.2':
    "“Relying Party ID (alan adı)” alanına trek.example.org gibi bir değer, “İzin verilen kaynaklar” alanına da TREK'ine hangi adresten ulaşıldığını gir, sonra “Kaydet”e tıkla. APP_URL değerini kullanmak için ikisini de boş bırak.",
  'help.guide.rotate-jwt-secret.title': 'Herkesin oturumunu bir seferde kapat',
  'help.guide.notification-defaults.step.2':
    'Bir hücreyi sıradaki duruma geçirmek için tıkla: “Açık”, “Kapalı”, “Engelli”. İpucu bir sonraki durumun adını gösterir ve her tıklama anında kaydedilir.',
  'help.ctx.notifications.bullet.2':
    'Üstteki “Tümü” ve “Okunmamış” arasında geçiş yaparak tüm bildirimleri ya da yalnızca okumadıklarını görürsün. Liste, kaydırdıkça daha fazlasını yükler.',
  'help.guide.read-notifications.step.3':
    "Bildirimin ilgili olduğu yeri açmak için altındaki düğmeye, yani “Vacay'ı Görüntüle”ye tıkla. Bu, bildirimi okundu olarak da işaretler.",
  'help.guide.filter-notifications.step.3':
    'Yalnızca okumadığın bildirimleri görmek için “Okunmamış”a tıkla. “Tümü” hepsini yeniden gösterir.',
  'help.guide.mark-notifications-read.tip.2':
    'Okundu olarak işaretlemek yalnızca arka plan rengini ve sayıyı değiştirir. Bildirim, sen silene kadar listede kalır.',
  'help.guide.delete-notifications.result': 'Bildirim listeden ve zilden kalkar.',
  'help.guide.notification-settings.result':
    '“Ayarlar”, “Bildirimler” sekmesinde açılır; her olay ve kanal için bir anahtar vardır.',
  'help.guide.link-journal.goal': 'Journey günlüklerinden birini, seçtiğin kişiler için seyahatin içinde göster.',
  'help.guide.link-journal.tip.3':
    'Sonradan “Seyahat ayarları”ndaki “Günlük” bölümünde “Erişimi düzenle”, “Günlüğü değiştir” ve “Bağlantıyı kaldır” bulunur. Bağlantıyı kaldırmak sekmeyi kaldırır; günlüğün kendisinde eklediğin kişiler erişimlerini korur.',
  'help.guide.dawarich-stays.result':
    'Durak, seyahatin bir yeri olur; seçtiğin günde ya da “Planlanmamış” altında yer alır ve panel onu tamamlanmış olarak işaretler.',
  'help.ctx.trip-days.bullet.7': 'Seyahat sürerken plan bugünün gününde açılır ve oraya kayar.',
  'help.guide.leave-stop-off-route.tip.2':
    '“Günden kaldır” durağı günden çıkarır; “Rotanın dışında bırak” ise durağı planda tutar.',
  'help.guide.move-booking-day.goal':
    'Bir ulaşımı veya rezervasyonu formunu açmadan doğrudan plandan başka bir güne taşı.',
  'help.guide.place-image-from-file.result': 'Fotoğraf; kartta, yerler sütununda, günde ve haritada yerin resmi olur.',
  'help.guide.place-own-hours.step.3':
    'Altındaki “Açılış Saatleri” haftayı, her gün için bir satır olarak gösterir. TREK yer için saat bulduysa satırlar zaten doludur; bulamadıysa önce “Çalışma saatleri ekle”ye tıkla. Her günün ne zaman açılıp kapandığını yaz, açık olmayan bir günde “Kapalı”ya tıkla.',
  'help.guide.add-accommodation.tip.5':
    'GPX izleri ve tur yerleri hiçbir zaman konaklama yeri olarak önerilmez; yalnızca seyahatin sıradan yerleri önerilir.',
  'help.guide.confirm-stay-booking.step.1':
    'Giriş yaptığın günü aç. Konaklamanın kartında “Rezervasyon” altında o geceye ait Otel rezervasyonu, “Beklemede” veya “Onaylandı” durumuyla görünür. Bu kutuya tıkla.',
  'help.guide.tour-map-lines.step.4':
    'Bir turu haritadan kaldırmak için sağ sütunu “Turlar”a geçir, turun üzerine gel ve göz simgesine, yani “Haritada gizle”ye tıkla. Turun çizgisi ve iğnesi haritadan kalkar, satırı listede soluk kalır ve üstü çizili bir göz (“Haritada göster”) taşır; bu gözle turu yeniden gösterebilirsin.',
  'help.guide.car-stops.step.1':
    'Arabayı aldığın günün başlığında ipucu “Güne ekle” olan + işaretine tıkla ve “Ulaşım ekle”yi seç.',
  'help.guide.car-stops.tip.2':
    '“Yukarı taşı” ve “Aşağı taşı” yalnızca sürüşte iki veya daha fazla durak olduğunda görünür.',
  'help.guide.transport-details.title': 'Bir ulaşımı aç ve ayrıntılarını kullan',
  'help.guide.transport-details.tip.1': 'Çizgisi çizili bir yolculukta “Haritada”ya yeniden tıklamak çizgiyi kapatır.',
  'help.guide.export-transports-csv.result':
    'Tarayıcın, seyahatin adını taşıyan bir dosya kaydeder, örneğin autumn-in-japan-transports.csv. Dosyada her yolculuk için bir satır vardır: Tür, Başlık, Durum, Başlangıç, Son, Nereden, Nereye, Konum, Onay kodu ve Notlar.',
  'help.guide.group-sort-bookings.goal': 'Kartları veya listeyi durum, gün ya da türe göre, istediğin sırada düzenle.',
  'help.guide.booking-on-map.tip.1':
    '“Haritada” yalnızca yeri olan rezervasyonlarda bulunur. Formda “Yer / Etkinlik” altında bir yer seç, düğme görünür.',
  'help.guide.export-bookings-csv.step.2':
    'Görünüm simgelerinin ardından gelen kaydırıcı simgesi olan “Görünüm seçenekleri”ni aç ve “Sırala” altında bir sıralama seç. Satırlar bu sıralamayı izler; her rezervasyon için bir satır olur ve bölüm başlıkları yer almaz.',
  'help.guide.edit-booking.tip.4':
    'Bir şeyi değiştirdiysen formun dışına tıklamak ya da Escape tuşuna basmak “Değişiklikler atılsın mı?” sorusunu getirir. “Düzenlemeye devam et” seni forma geri götürür.',
  'help.guide.arrange-packing-list.step.2':
    'Bir listenin içinde, satırın solundaki tutamaç o öğeyi yukarı veya aşağı sürükler. Satırın sol kenarındaki vurgu renginde bir çizgi öğenin nereye ineceğini gösterir.',
  'help.guide.count-packed-pieces.goal': 'Bir öğeye miktar ver ve parçalarını tek tek paketlendi olarak işaretle.',
  'help.guide.count-packed-pieces.tip.3': 'Miktarı bir olan öğede sayaç görünmez; yalnızca onay kutusu vardır.',
  'help.guide.expense-receipts.step.2':
    "“Fişler ve Faturalar”ın yanındaki “Ekle”ye tıkla ve fotoğrafı veya PDF'i seç; aynı anda birkaç dosya da seçebilirsin. Her dosya başlığın altında listelenir ve yanında dosyayı kaldırmak için bir çöp kutusu bulunur.",
  'help.guide.files-sync-settings.goal':
    'Belgelerin yalnızca depolamandan içe mi aktarılacağına, yalnızca ona mı dışa aktarılacağına yoksa ikisine birden mi karar ver; bir belge silindiğinde ya da iki yerde de değiştirildiğinde ne olacağını belirle.',
  'help.guide.files-sync-settings.tip.2':
    '“Bana sor” seçiliyken iki yerde de düzenlenen belge, kartın altındaki “Bakılması gerekenler” bölümünde bekler. “Çöz”e tıkla ve “TREK sürümünü tut”, “Sağlayıcıdaki sürümü tut” veya “İkisini de tut”u seç.',
  'help.guide.manage-notes.goal':
    'Bir notu tam olarak aç, önemli olanı en üstte tut; güncelliğini yitirmiş olanı düzelt veya kaldır.',
  'help.guide.manage-notes.tip.2':
    'Düzenlerken zaten ekli olan bir dosyadaki kırmızı çarpı, “Kaydet”e tıklamadan önce dosyayı hemen siler ve dosya çöp kutusuna gitmez. Bir notun tüm dosyaları ayrıca seyahatin “Dosya” sekmesinde de görünür.',
  'help.guide.note-categories.step.6':
    '“Notlar” kartında başlığın altındaki etiketler kartları filtreler. Yalnızca bir kategorinin notlarını görmek için o kategoriye tıkla; “Tümü” ya da aynı etikete yeniden tıklamak hepsini gösterir.',
  'help.guide.roadtrip-reorder.tip.1':
    'Bir durağı burada taşımak onu gün planında da taşır: “Gün” aynı sırayı gösterir.',
  'help.guide.roadtrip-overnight.step.1':
    '“Rota üzerinde” bölümünde “Aranan” altında “Konaklama”yı ya da çadır yeri için “Kamp alanı”nı işaretle, durmak istediğin günü seç ve “Ara”ya tıkla.',
  'help.guide.roadtrip-overnight.tip.3':
    '“Sürüş ayarları”nda “Rota çizgisi” altındaki “Her güne konaklama yerinde başla ve orada bitir” açıksa ertesi günün sürüşü, geceyi geçirdiğin yerden başlar.',
  'help.guide.roadtrip-stop-fill.title': 'Bir durağın ne kadar dolu olacağını belirle',
  'help.guide.roadtrip-bookings.title': 'Uçuşunu, trenini veya feribotunu sürüşe dahil et',
  'help.guide.roadtrip-bookings.tip.2':
    'Bir durakta rezerve edilen masa ya da bilet o durakta etiket olarak görünür; hiçbir durağa ait olmayanlar “Bu gün için ayrıca rezerve edildi” altında listelenir.',
  'help.guide.roadtrip-google-import.step.3':
    'Bulunan durakları kontrol et. Her birinin yeri gösterilir; “Location unresolved” işaretli durak atlanır.',
  'help.guide.roadtrip-hazards.step.1': 'Sağ sütunda “Sürüş ayarları”nı aç.',
  'help.ctx.trip-tours.summary':
    'Plan sekmesinin “Turlar” modundaki sağ sütunu: seyahatin tüm turları günlerin yanında tek bir listede. Buradan turları günlere ekler, listeyi filtreler, çizgileri haritada gizler ve GPX veya KML dosyalarını içe aktarırsın. Rotalar “Turlar” sekmesinde çizilir ve değiştirilir.',
  'help.guide.tour-show-list.goal':
    'Yerler sütununun yerine seyahatin turlarını göster; turları günlerin yanında görüp seçebilirsin.',
  'help.guide.tour-show-list.tip.3':
    '“Turlar” eklentisi açıkken izler hiçbir zaman “Yer” listesinde görünmez: içe aktarılan her iz bir turdur ve burada listelenir.',
  'help.guide.tour-add-to-day.step.5':
    'Etapları olan bir tur için aynı menüde bir soru daha çıkar. “Bu günden itibaren etaplar” 1. etabı o güne, sonraki her etabı ardından gelen günlere koyar; “Bu gün tüm tur” hepsini o tek güne koyar.',
  'help.guide.tour-day-times.step.1':
    'Gün sütununda turun satırının üzerine gel, “Diğer seçenekler”e (üç nokta) tıkla ve “Düzenle”yi seç.',
  'help.guide.tour-day-times.result':
    'Tur, saatli herhangi bir durak gibi, başlangıcı ve bitişiyle günün zaman çizelgesinde görünür.',
  'help.guide.tour-remove-from-day.result': 'Gün artık turu listelemez ve listedeki satırında “Gün” rozeti görünmez.',
  'help.guide.tour-filter-list.tip.2':
    'Bir bölüm yalnızca turlar o konuda birbirinden farklıysa görünür, bu yüzden kısa bir listede yalnızca “Durum” olabilir.',
  'help.guide.tour-hide-on-map.tip.1':
    'Gizleme yalnızca senin için geçerlidir ve bu tarayıcıda bu seyahat için saklanır: tur, günleri ve rengi değişmez, tur başkalarının haritasında görünmeye devam eder.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Seyahatte zaten olan bir iz “Zaten seyahatte” olarak işaretlenir ve iki kez içe aktarılmaz.',
  'help.ctx.trip-tour-detail.bullet.4':
    'En alttaki satır: bir gün açıkken “Güne Ekle” veya “Günden Kaldır”, başlangıç noktasına “Navigasyon”, turun web sayfası, GPX, cihazın dosya paylaşabiliyorsa “Paylaş”, “Koleksiyon” ve “Kopyala”.',
  'help.guide.tour-detail-read.step.5':
    'Aşağıda ölçüler gelir: “Mesafe”, “En düşük rakım”, “En yüksek rakım”, “Toplam yükselme” ve “Toplam alçalma”, onların altında süreler ve turun çizgisinin renginde yükseklik profili.',
  'help.guide.tour-detail-read.result':
    'Turun kartı planın yanında açıktır; turun hangi günlerde olduğunu, ne kadar uzun ve dik olduğunu ve nereden geldiğini öğrenmiş olursun.',
  'help.guide.tour-rename-colour.tip.2': 'Kalem ve nokta yalnızca yerleri düzenleyebilen üyeler için çalışır.',
  'help.guide.tour-take-along.tip.2':
    '“Ayarlar”da tercih ettiğin bir harita uygulamasını seç; “Navigasyon” uygulamaları listelemek yerine o uygulamayı hemen açar.',
  'help.guide.tour-copy-keep.step.3':
    'Bir turu diğer seyahatler için saklamak istiyorsan turu aç ve kartının altındaki “Koleksiyon”a tıkla.',
  'help.guide.tour-packing-link.goal':
    'Bir tur için nelerin paketleneceğini doğrudan turun kartında göster; seyahatin paket listesinden ya da listelerinden biri kullanılır.',
  'help.guide.tour-packing-link.tip.3':
    'Bağlamak için yerleri düzenleme hakkı gerekir. Diğer herkes bağlı listeyi görür ama bağlantıyı değiştiremez.',
  'help.guide.tour-files.tip.2': '“Yükle” yalnızca turu değiştirebilen ve dosya ekleyebilen üyelere gösterilir.',
  'help.guide.tour-activity-link.step.5':
    'İz artık “Gerçek iz” altında, planın yanında kendi değerleri ve kendi profiliyle görünür.',
  'help.guide.tour-activity-compare.step.2':
    '“Plandan en uzak mesafe”, izin planlanan çizgiden en çok ne kadar saptığını, “Plan dışı” ise izin ne kadarının bu çizginin dışında kaldığını gösterir.',
  'help.guide.tour-origin-check.step.1':
    'Turun kartını aç ve “Köken”e kadar kaydır. “Kaynak” turun nereden geldiğini gösterir: dosyanın adıyla birlikte GPX içe aktarımı, KML veya KMZ içe aktarımı ya da adresiyle birlikte wanderer.',
  'help.ctx.trip-tour-planner.summary':
    'Seyahatin tur planlayıcısı: solda düzenleyici, sağda seyahatin tüm turları ve ikisinin arasında harita. Burada bir turu nokta nokta çizer, gerçek patikalar ve yollar boyunca yönlendirir, ayrıntılarını ekler ve seyahate kaydedersin.',
  'help.guide.tour-open-workspace.goal': 'Tur planlayıcıyı aç ve her bölümünün ne işe yaradığını öğren.',
  'help.guide.tour-open-workspace.tip.1':
    'Her panelin iç kenarındaki sekmede bulunan “Daralt” paneli gizleyip haritaya daha fazla yer açar; “Plan” ve “Bu seyahatin turları” panelleri yeniden gösterir. Bir panelin genişliğini değiştirmek için kenarını sürükle.',
  'help.guide.tour-draw-route.step.3':
    '“Ara noktalar” altında “Nokta ekle”nin açık olduğunu kontrol et (haritadaki etiketteki “Nokta koy” ile aynı anahtardır), sonra haritada turun başladığı yere tıkla.',
  'help.guide.tour-draw-route.result':
    'Haritada numaralı bir rota ve “Ara noktalar” altında noktaları görünür; tur adlandırılmaya ve kaydedilmeye hazırdır.',
  'help.guide.tour-type-profile.tip.2':
    'Bazı türler kaydedilmeden önce daha fazla bilgi ister: “Koşu” için “Planlanan tempo”, “Kürek turu” için tekne ve su türü, “Kayak ve kış” turu için branş.',
  'help.guide.tour-edit-points.step.5': 'Yanındaki çöp kutusu olan “Rota noktasını kaldır” noktayı turdan çıkarır.',
  'help.guide.tour-shaping-points.step.2':
    'Noktayı rotanın izlemesini istediğin yola sürükle. Rota bu noktadan geçecek şekilde yeniden planlanır.',
  'help.guide.tour-loop-reverse.goal': 'Turu başladığı yerde bitir ya da yönünü ters çevir.',
  'help.guide.tour-leg-by-hand.title': 'Bir bölümü elle çiz ya da yeniden planla',
  'help.guide.tour-leg-by-hand.result':
    'Bölüm seçtiğin yerde düz bir çizgi olur ve elle çizildi olarak işaretlenir ya da yeniden yönlendirilir.',
  'help.guide.tour-trip-places.tip.2':
    'Durağı kaldırmak veya bağlantısını kesmek, yeri günleriyle birlikte seyahatte olduğu gibi bırakır.',
  'help.guide.tour-details-times.step.4':
    '“Planlandı” toplam süreyi gösterir. Üzerine yazmak için kendi süreni gir; süre o zaman “Elle değiştirilen” olarak işaretlenir.',
  'help.guide.tour-save.step.2':
    '“Yeni tur” yanındaki nokta kaybolana kadar bekle. “Kaydet” için rota ve tüm yükseklik değerleri hazır olmalıdır.',
  'help.guide.tour-edit-saved.goal': 'Daha önce planladığın bir turu aç, değiştir ve yeniden kaydet.',
  'help.guide.tour-edit-saved.result': 'Kayıtlı tur artık değişikliklerini içerir.',
  'help.guide.tour-summary-profile.tip.2':
    "Bir via ferrata'ya tırmanan rotada, rakamların üstünde derecesini gösteren bir uyarı rozeti görünür.",
  'help.guide.tour-list-manage.step.4':
    '“Gezinin toplamı”nın üstündeki düğme filtredir. Düğmede gösterdiği durumun adı ve tur sayısı yazar; başlangıçta “Tümü” seçilidir.',
  'help.guide.tour-delete.step.1':
    '“Bu seyahatin turları” altında turun üzerine gel ve satırının sağındaki çöp kutusuna, yani turun adıyla birlikte “Sil”e tıkla.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Sen düzenlerken panelin üstünde “Bu tur başka yerde kaydedildi” mesajı belirir. Sen karar verene kadar değişiklikler korunur.',
  'help.ctx.trip-tour-import.summary':
    "Burada başka bir yerde zaten var olan turları seyahate aktarırsın: bir saatten veya uygulamadan GPX, KML ya da KMZ dosyası, diğer seyahatlerinden birindeki bir tur ya da kendi wanderer'ındaki bir patika. İçe aktarılan tur kaydedildiği gibi saklanır ve ondan düzenlenebilir bir sürüm planlayabilirsin.",
  'help.guide.tour-import-gpx.step.1':
    'Seyahatin “Turlar” sekmesini aç. Sağdaki “Bu seyahatin turları”nın üstünde + işaretine (“Tur ekle”) tıkla.',
  'help.guide.tour-import-gpx.tip.4':
    'KML veya KMZ dosyası için “İçe aktarılmaz” bölümünde çizgiler dışında dosyada neler olduğu da listelenir: iğneler, alanlar ve diğer öğeler.',
  'help.guide.tour-view-import.tip.1':
    'İçe aktarılan tur nokta nokta düzenlenemez. Yukarıdaki “Düzenlenebilir sürüm” kartındaki “Düzenlenebilir sürüm planla”, ondan değiştirebileceğin bir tur oluşturur.',
  'help.guide.tour-plan-from-import.step.3':
    'Bu turu yerinde yeniden planlamak için “İçe aktarımı değiştir”e tıkla: günleri ve notları kalır, kaydedilen iz ise geri dönebilmen için saklanır. “Yeni tur olarak planla” içe aktarmaya dokunmaz ve yanında ikinci bir tur oluşturur.',
  'help.guide.tour-restore-recorded.goal':
    'İçe aktarılan turun yeniden planlanmasını geri al ve özgün izi, aradan uzun zaman geçse bile, geri getir.',
  'help.guide.tour-take-over.goal':
    'Diğer seyahatlerinden birinde zaten planladığın ya da içe aktardığın bir turu yeniden çizmeden kullan.',
  'help.guide.tour-take-over.tip.2':
    'Yalnızca diğer seyahatlerin ve yalnızca ilk 100 tur listelenir. Gerisini bulmak için ara veya filtrele.',
  'help.guide.tour-import-wanderer.step.4': '“Seyahate aktar”a tıkla.',
  'help.ctx.trip-tour-map.bullet.1':
    'Haritanın sol altındaki etiket, açık olan turun türünün sunduğu temel haritaları içerir: “Harita”, “Topo”, doğa yürüyüşünde “Yürüyüş”, bisiklet turunda “Bisiklet” ve “Uydu”. Burada seçtiğin harita yalnızca planlayıcı için geçerlidir ve “Ayarlar”daki harita ayarını hiçbir zaman değiştirmez.',
  'help.guide.tour-map-layers.step.2':
    'Eş yükselti çizgileri ve gölgelendirilmiş kabartma için “Topo”ya tıkla; bu harita zeminin ne kadar dik olduğunu gösterir. Seçtiğin harita etikette vurgulu kalır.',
  'help.guide.tour-along-search.step.1':
    '“Turlar” sekmesinde bir tur aç ve sol paneli turun duraklarının altındaki “Tur boyunca” bölümüne kadar kaydır. Kart, turun bir rotası olduğunda orada görünür.',
  'help.guide.tour-along-search.tip.3':
    "Sonuçlar OpenStreetMap'ten ve TREK'in yer dizininden gelir, bu yüzden arama için internet bağlantısı gerekir. Hiçbir şey bulunamazsa “Widen to” sonraki mesafeyi dener; sunucu meşgulse “Yeniden dene”, tekrar deneyebileceğin ana kadar geri sayım gösterir.",
  'help.guide.tour-along-add-stop.tip.1':
    'Yer, seyahatin bir yeri değil turun bir durağı olur, bu yüzden yerler listesinde görünmez.',
  'help.guide.tour-3d-terrain.step.4':
    'Tepeleri üç kata kadar yükseltmek için “Kabartma” kaydırıcısını sürükle; bu, hafif eğimli arazide işe yarar.',
  'help.guide.tour-3d-flyover.step.1':
    "Turu 3D'ye geçir. Rota boyunca manzara yüklenirken oynat düğmesinin yerinde bir halka dolar; halka dolunca “Uçuşu oynat”a tıkla. Kamera rota boyunca bir noktayı takip eder ve “Tur özeti”ndeki yükseklik profilinde imleç de onunla birlikte ilerler.",
  'help.guide.tour-map-overlays.title': 'Haritanın üzerinde pistleri veya deniz işaretlerini göster',
  'help.guide.tour-map-overlays.tip.2':
    'Hiçbir tur açık değilken de pist anahtarı vardır, böylece bir şey planlamadan önce bir kayak alanına göz atabilirsin. Doğa yürüyüşünde etiket bunun yerine görünümdeki rota sayısıyla birlikte “Via ferrata rotaları”nı sunar.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Turun satırındaki artı, yani “Güne ekle”, etapları seçtiğin günden başlayarak her gün bir etap olacak şekilde seyahate yerleştirir ya da turun tamamını o tek güne koyar.',
  'help.guide.tour-multi-day.step.6':
    'Turu yeniden günübirlik tura çevirmek için “Günübirlik”e tıkla ve “Günübirlik tura çevrilsin mi?” sorusunu “Etap sonlarını kaldır” ile onayla. Rota olduğu gibi kalır.',
  'help.guide.tour-stages-on-days.step.1':
    '“Bu seyahatin turları” içinde çok günlü turun üzerine gel ve artıya, yani “Güne ekle”ye tıkla.',
  'help.guide.tour-stages-on-days.tip.3':
    'Çok günlü bir turu “Plan” sekmesinde bir güne sürüklemek aynı soruyu bir pencerede sorar; turun kartındaki “Güne Ekle” de aynısını yapar.',
  'help.ctx.trip-tour-hike.bullet.4':
    "Ara noktaların altındaki “Parkur ayrıntıları”, her kesimin SAC derecesini, zeminini ve yol türünü OpenStreetMap'ten gösterir ve rotayı haritada bunlara göre renklendirir. Buradaki hiçbir şey turu değiştirmez.",
  'help.guide.tour-hike-plan.step.4':
    '“Nokta ekle” baştan açıktır: yürüyüşün başladığı ve bittiği yere haritada tıkla. Yanındaki “Gezi yerleri” ise bunun yerine seyahatin bir dağ evini veya otelini seçmeni sağlar. İki noktadan itibaren TREK yürüyüş rotasını hesaplar.',
  'help.guide.tour-hike-trail-details.title': 'Bir yürüyüş boyunca dereceleri, zeminleri ve yol türlerini gör',
  'help.guide.tour-hike-trail-details.tip.1':
    "OpenStreetMap'te değeri olmayan yollar “Bilinmiyor” altında listelenir ve bilinmiyor demek kolay demek değildir. Bazılarında “Bu kez sorgulanamadı” yazıyorsa “Yeniden dene”ye tıkla.",
  'help.guide.tour-hike-round.step.4':
    'Seçmek için bir döngüye tıkla. Satırında mesafe, tırmanış ve süre ile istediğin mesafeden ne kadar saptığı görünür.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Kesimin başladığı durağın üzerine gel, satırındaki “Diğer işlemler”e tıkla ve “Sonraki bölüm için yolları karşılaştır”ı seç.',
  'help.guide.tour-ferrata-add.title': 'Bir yürüyüşe via ferrata ekle',
  'help.guide.tour-ferrata-add.tip.1':
    "Via ferrata için ekipman ve deneyim gerekir. Rozetin ipucu, rotanın via ferrata'nın ne kadarını tırmandığını söyler.",
  'help.guide.tour-run-plan.step.3': '“Planlanan tempo”nu kilometre başına dakika ve saniye olarak yaz, örneğin 7:30.',
  'help.guide.tour-run-ways.title': 'Bir koşunun hangi yollardan geçtiğini gör',
  'help.ctx.trip-tour-walk.title': 'Şehir yürüyüşü',
  'help.guide.tour-walk-plan.goal':
    'Duraklardan gezi yürüyüşü oluştur; her durakta ne kadar kalacağını ve hangilerinin önemli olduğunu belirt.',
  'help.guide.tour-walk-plan.tip.2':
    'Şehir yürüyüşünde yürüyüş sınırı ve “Molalar” alanı yoktur: bunun yerine kalış süreleri kullanılır.',
  'help.guide.tour-walk-sights.step.4':
    'Listeden bir yere tıkla. Kartı haritanın üzerinde açılır: “Nereye girer” altında yerin arasına gireceği iki durağı seç.',
  'help.guide.tour-walk-day-times.step.1':
    'Yürüyüşü bir güne ekle: “Bu seyahatin turları” içinde satırındaki yuvarlak + işaretine (“Güne ekle”) tıkla ve günü seç.',
  'help.guide.tour-walk-day-times.result':
    'Sen vardığında her yer açık olana kadar durakların sırasını veya kalış sürelerini değiştirebilirsin.',
  'help.guide.tour-walk-google-import.tip.2':
    '“Başka bağlantı kullan” seni bağlantı alanına geri götürür. Yükleme, planlayıcıdaki kaydedilmemiş değişikliklerin yerine geçer ve pencere bunu önceden uyarır.',
  'help.guide.tour-walk-check-off.step.4':
    'Listenin üstünde ziyaret edilen durak sayısı ve kalan yürüyüş süresi görünür. Bir duraktaki “Geri al” işaretini kaldırır.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Sağdaki “Tur özeti”, “Sürüş süresi (tahmini)” değerini verir: yönlendiricinin tırmanışlar dahil profil için hesapladığı süredir. Molalar dahil değildir.',
  'help.guide.tour-bike-profile.step.4':
    '“Ara noktalar” altında “Gezi yerleri”ne tıkla ve başlangıcı ile bitişi seç, burada önce Hotel Alpenroyal, sonra Hotel Greif. İstersen “Nokta ekle”nin açık olduğunu kontrol edip haritaya da tıklayabilirsin. İki noktadan itibaren TREK rotayı hesaplar.',
  'help.guide.tour-bike-profile.tip.5':
    'Bir yönetici CyclOSM haritasına izin verdiyse bisiklet turu açıkken haritadaki katman satırında ayrıca “Bisiklet” de görünür. Yüklenmeyi bırakırsa “Harita”ya geç. Tur değişmez.',
  'help.guide.tour-bike-surfaces.tip.1':
    "“Veride yok”, OpenStreetMap'in orada zemin bilgisi kaydetmediği anlamına gelir. Zemin bilinmiyor, ama bu zeminin iyi olduğu anlamına gelmez.",
  'help.guide.tour-bike-mtb-grades.step.3': 'O patikaları haritada vurgulamak için bir derece satırına tıkla.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Önce “Branş” gelir ve hiçbir şey önceden seçili değildir: Alp disiplini, Snowboard, Kayaklı koşu, Dağ kayağı, Kar ayakkabısı veya Kış yürüyüşü. Kayaklı koşu ayrıca “Teknik” ister: Klasik, Serbest stil veya Bilinmiyor. Branş seçilmeden tur kaydedilemez.',
  'help.guide.tour-ski-plan.step.2': '“Tur türü”nü aç ve “Kayak ve kış”ı seç.',
  'help.guide.tour-ski-plan.tip.4':
    'Pist verisi olmayan yerde bölüm, noktaları arasında düz bir çizgi olur. Kar ayakkabısı ve kış yürüyüşünde yaz yolları kullanılabilir; bölümdeki gri bir not bunu belirtir.',
  'help.guide.tour-ski-options.step.5':
    '“Hariç tut” altında binmek istemediğin her lift türüne bas: “Çekme lifleri”, “Açık telesiyejler”, “Gondollar”, “Teleferikler” veya “Füniküler ve trenler”. Basılan türün üstü çizilir.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Satırın sunduğu çözüme tıkla: “Daha zor pistlere izin ver”, “Bu lifte izin ver”, “Liftle in”, “Tekniği değiştir” veya “Disiplini değiştir”. Seçenek değişir ve bölüm yeniden planlanır.',
  'help.guide.tour-ski-summary.goal': 'Günün kayağa, liftlere, beklemeye ve yürümeye nasıl bölündüğünü gör.',
  'help.guide.tour-ski-summary.result':
    'Günün pistlerde, liftlerde ve liftlerde beklemekte ne kadar sürdüğünü öğrenirsin.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Katman haritalanmış veridir, canlı bir rapor değildir: neyin açık veya bakımlı olduğu, kar ya da çığ hakkında hiçbir şey söylemez. Anahtar hiçbir tur açık değilken de bulunur, böylece planlamadan önce bir kayak alanına göz atabilirsin.',
  'help.guide.tour-ski-import.step.5':
    'Açmak için “Bu seyahatin turları” içindeki ize tıkla. Branşını sonradan düzeltmek için “Kayak izi” kartındaki “Değiştir”e tıkla.',
  'help.ctx.trip-tour-paddle.bullet.1':
    '“Tur türü” altında “Kürek turu” bir “Tekne” (Kano (kayak), Kano, SUP veya Diğer) ve “Su” (Nehir veya Göl) ister. İkisi de seçilmeden tur kaydedilemez.',
  'help.guide.tour-paddle-setup.step.1': '“Turlar” sekmesinde sol sütunun üstündeki “Yeni tur planla”ya tıkla.',
  'help.guide.tour-paddle-setup.tip.2':
    "Kürek turunun haritasında “Harita” ve “Uydu” seçenekleri ile katman olarak OpenSeaMap'ten “Deniz işaretleri” sunulur.",
  'help.guide.tour-paddle-water-route.step.3':
    '“Sonraki bölümü suda planla”yı seç. TREK bölümü bu noktadan sonrakine nehir veya göl boyunca planlar.',
  'help.guide.tour-paddle-portage.title': 'Tekneyi bir engelin çevresinden taşı',
  'help.guide.tour-paddle-portage.tip.2':
    'Son noktada “Tekneyi buradan taşı”, sonraki noktayı belirlediğinde geçerli olur. Satırda “Buradan taşı” yazar ve çarpı işareti (“Taşımaktan vazgeç”) bunu geri alır.',
  'help.guide.tour-paddle-lock.step.4':
    '“Bekleme” ve “Geçiş” için dakikaları yaz. İkisi de girilince kart toplamlarını gösterir.',
  'help.guide.tour-paddle-time.step.2':
    'Şerit, rotayı baştan sona gösterir: su, kahverengi taşıma bölümleri ve kilitler çentik olarak. Rotadaki engeller, haritada bulmak için tıklayabileceğin işaretlerdir.',
  'help.guide.tour-paddle-wind.title': 'Bir kürek günü için rüzgârı kontrol et',
  'help.guide.tour-paddle-wind.tip.3':
    'Göl geçişi olan rüzgârlı bir günde kart “Kıyıya yakın planla” seçeneğini sunar; bu seçenek gölleri kıyı boyunca planlar.',
  'help.guide.tour-paddle-checklist.step.4':
    'Bir girdiye tıkla. Harita ona gider: bir engel için kartı kararınla birlikte açılır, kendi taşıma noktan veya kilidin için noktası seçilir.',
  'help.guide.tour-paddle-track-marks.title': 'Kaydedilmiş bir kürek izinde taşıma noktalarını ve kilitleri işaretle',
  'help.guide.tour-paddle-track-marks.step.7': 'Kartları aç, dakikalarını yaz ve “Kaydet”e tıkla.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Rota kendi penceresinde açılır: bir bölüm seç, bölümü hangi “Yön”de süreceğini belirle, “At erişimi”ni kontrol et, sonra “Bölümü al”a tıkla.',
  'help.guide.tour-horse-plan.step.3':
    '“Binicilik rotaları” kartında “Harita görünümünde ara”ya tıkla. Görünümdeki işaretli tüm binicilik rotaları uzunluklarıyla orada listelenir.',
  'help.guide.tour-horse-plan.tip.3':
    'Aramadan sonra haritayı mı kaydırdın? Düğmede “Bu görünümde ara” yazar. Görünüm çok büyükse önce yakınlaştırman istenir.',
  'help.guide.tour-horse-gap.step.4':
    '“Ara noktalar” kartında köprü, uzunluğuyla birlikte “Elle, denetlenmemiş” olarak görünür. Nedenini okumak için üzerine gel.',
  'help.guide.tour-horse-recorded.step.2':
    '“İçe aktarma önizlemesi” açılır ve henüz hiçbir şey kaydedilmez. “Şu olarak içe aktar” altında “Tur türü”nü “At gezisi” yap. Üç rozet, içe aktarmanın nelerin korunduğunu ve nelerin hesaplanmadığını gösterir.',
  'help.guide.dateless-trip.goal': 'Ne zaman seyahat edeceğini bilmeden planlamaya başla.',
  'help.guide.trip-reminder.step.3': '“Güncelle”ye tıkla.',
  'help.guide.upcoming-reservations.goal': 'Tüm seyahatlerinde sıradaki rezervasyonları gör ve ait olduğu seyahati aç.',
  'help.guide.log-day.tip.3':
    'Tam gün şirket tatili olarak işaretlenmiş bir güne izin girilemez. Yarım gün şirket tatilinde bir izin günü yalnızca 0,5 gün düşer.',
  'help.guide.half-company-holiday.goal':
    'Günün tamamını kapatmadan herkese serbest bir öğleden sonra ver, örneğin Noel arifesinde.',
  'help.guide.public-holidays.tip.2': 'Adını görmek için tablodaki bir tatilin üzerine gel.',
  'help.guide.edit-holiday-calendar.step.3':
    'Ülkeyi veya bölgeyi listelerden değiştir ya da takvimi kaldırmak için çöp kutusuna tıkla.',
  'help.guide.person-color.step.2': 'Bir renk seç. Renk anında kaydedilir ve pencere kapanır.',
  'help.guide.answer-fusion-request.goal':
    'Seni davet eden biriyle tatil planlarını birleştirip birleştirmeyeceğine karar ver.',
  'help.guide.log-for-partner.goal': 'Planına birleştirilen bir kişi için izin günü gir, örneğin o senden istediğinde.',
  'help.guide.dissolve-fusion.goal': 'Birleştirilmiş planı yeniden ayrı planlara böl.',
  'help.guide.country-places.step.1': 'Ziyaret ettiğin bir ülkeyi ara ve seç. Kartı alttaki panelde görünür.',
  'help.guide.tour-activity-stats.step.3':
    'Sayılara bak: köşesinde tur sayısı yazan mesafe, ardından “Toplam yükselme” ve “Toplam alçalma”. “Tüm türler” seçiliyken en çok yaptığın üç tür, her birinin sayısı ve mesafesiyle birlikte altta listelenir.',
  'help.guide.move-to-list.step.1': 'Filtre satırındaki onay kutusu simgesine, yani “Seç”e tıkla ve yerleri işaretle.',
  'help.guide.tour-collection-add-to-trip.step.2':
    '“Geziye” altında seyahati seç. Tur ekleme iznin olmayan seyahat soluk görünür.',
  'help.guide.tour-collection-manage.goal':
    'Bir listede hangi turların olduğunu ve nereden geldiklerini gör, artık ihtiyacın olmayanları kaldır.',
  'help.guide.entry-draft.goal': "Bir girdiyi şimdi yaz ve hazır olana kadar paylaşılan journey'de gizle.",
  'help.guide.journey-map-layers.step.2':
    'Harita açıklaması için çubuğun sonundaki (i) simgesine tıkla: tüm iğneleri, noktaları ve çizgileri açıklar.',
  'help.guide.journey-keep-route.step.2':
    'Günün nerede başlayıp bittiğini belirleyen “Günün saat dilimi”ni kontrol et ve kaydı incele: mesafe, zaman aralığı, parçalar ve boşluklar.',
  'help.guide.journey-day-stays.step.2':
    'Bir durakta “Günlük kaydı yaz”a tıkla. Girdi o güne, varış saatinde ve durağın adı ile konumuyla eklenir.',
  'help.guide.journey-take-over-day.step.2':
    'Tutmak istediğin durakları işaretle ve adlarını düzelt. İşaretli iki durak arasındaki “Tek kayıtta birleştir” bunları birleştirir, “Ayrı tut” yeniden ayırır.',
  'help.guide.journey-auto-prepare.step.1': '“Journey Ayarları”nı açmak için başlığın sağ üstündeki ⋯ simgesine tıkla.',
  'help.guide.photo-location.step.1': '“Journey Ayarları”nı açmak için başlığın sağ üstündeki ⋯ simgesine tıkla.',
  'help.guide.share-public.tip.3':
    'Taslaklar bağlantıda hiçbir zaman görünmez; kaydedilen rotalar ise yalnızca yayımlanmış girdisi olan günlerde görünür.',
  'help.ctx.settings-plugins.title': 'Eklentiler',
  'help.ctx.settings-about.bullet.2':
    "“Hata Bildir” ve “Özellik İsteği” projeyi GitHub'da açar; “Wiki” dokümantasyonu açar.",
  'help.guide.map-provider.tip.3': 'GL haritada döndürmek ve eğmek için sağ tıklayıp sürükle; orta tuş bir yer ekler.',
  'help.guide.web-push-device.step.1':
    '“Bu cihazda anlık bildirimler” altında “Bu cihaz için aç”a tıkla ve tarayıcı sorunca bildirimlere izin ver. “Test gönder” bir bildirimin ulaşıp ulaşmadığını kontrol eder.',
  'help.guide.connect-airtrail.title': "AirTrail'ini bağla",
  'help.guide.connect-dawarich.title': "Dawarich'ini bağla",
  'help.guide.tour-connect-wanderer.title': "wanderer'ını bağla",
  'help.guide.tour-connect-wanderer.tip.3': 'Sağdaki “Bağlantıyı kes” belirteci yeniden kaldırır.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Bu ipuçlarını hangi kanallardan alacağını “Bildirimler” altında, “wanderer: rotalarınla ilgili ipuçları” satırında seçersin.',
  'help.guide.plugin-settings.tip.1':
    'Bu ayarlar yalnızca sana aittir; diğer üyeler eklentiyi kendileri için ayrıca ayarlar.',
  'help.guide.offline-conflicts.step.3':
    'Sunucunun reddetmeye devam ettiği değişiklikler “Çevrimdışı önbellek” altında “Başarısız değişiklikler” olarak görünür: “Yeniden dene” onları bir kez daha gönderir, “Vazgeç” ise sunucudaki sürümü korur.',
  'help.ctx.admin-notifications.bullet.4':
    'En altta “Kullanıcılar için varsayılanlar”: ayarı değiştirmemiş herkes için olay ve kanal başına “Açık”, “Kapalı” veya “Engelli”.',
  'help.guide.default-user-settings.step.2':
    "Ayarladığın bir alanın adının yanında bir sıfırlama bağlantısı belirir; bu bağlantı TREK'in yerleşik varsayılanını geri getirir.",
  'help.guide.own-routing-engine.title': 'Kendi yönlendirme sunucularını kullan',
  'help.guide.admin-passkeys.result':
    'Giriş sayfasında “Passkey ile oturum açın” seçeneği görünür ve kullanıcılar ayarlarından passkey ekleyebilir.',
  'help.guide.rotate-jwt-secret.goal': 'Şüpheli bir sızıntıdan sonra tüm oturumları sonlandır.',
  'help.guide.notification-defaults.result':
    'Bir hücreyi değiştirmemiş herkes senin seçtiğin ayarla başlar; engellenen hücreler kullanıcıların ayarlarında kilitli görünür.',
  'help.ctx.notifications.bullet.3':
    "Her bildirimde kimin neyi nerede yaptığı yazar. Okunmamışların arka planı renklidir. Altındaki “Seyahati Görüntüle” veya “Vacay'ı Görüntüle” gibi bir düğme seni ilgili yere götürür ve bildirimi okundu olarak işaretler.",
  'help.guide.read-notifications.tip.1':
    'Zil, gezinme çubuğu olan her ekranda bulunur ve yeni bir bildirim gelince sayısı kendiliğinden güncellenir.',
  'help.guide.filter-notifications.tip.1':
    'Sayfa, aşağı kaydırdıkça eski bildirimleri yükler; bu yüzden ilk ekrandan sonrası kesilmez.',
  'help.guide.mark-notifications-read.result':
    'Hiçbir bildirimin arka planı renkli değildir ve zilin üzerindeki kırmızı sayı kaybolur.',
  'help.guide.notification-settings.title': 'Hangi konularda bildirim alacağını seç',
  'help.guide.link-journal.step.1': 'Seyahatin adının yanındaki “Seyahat ayarları”na tıkla ve solda “Günlük”ü seç.',
  'help.guide.dawarich-stays.tip.1':
    '“Yer ekle”ye tıklamadan seyahate hiçbir şey eklenmez. Bir duraktan eklenen yerin ayrıntılarında şu yazar: “Dawarich kayıtlarından eklendi”.',
  'help.guide.leave-stop-off-route.title': 'Bir durağı rotanın dışında bırak',
  'help.guide.move-booking-day.step.1':
    'Gündeki rezervasyon satırının üzerine gel: solundaki tutamaç satırın sürüklenebileceğini gösterir.',
  'help.guide.place-image-from-file.tip.1':
    'Yalnızca JPG, PNG, GIF ve WebP dosyaları listelenir; PDF bilet listelenmez.',
  'help.guide.place-own-hours.step.4':
    "“Açılış Saatleri”nin sağındaki düğmeler: kopyalama düğmesi her güne Pazartesi'nin saatlerini verir, X ise kendi girdiğin saatleri kaldırır. TREK'in kendi bulduğu saatler varsa “Yer ayrıntılarından al” onları geri getirir.",
  'help.guide.confirm-stay-booking.step.2':
    'Rezervasyon planın üzerinde açılır. Başlığındaki ilk etiket durumunu gösterir.',
  'help.ctx.trip-map.bullet.9':
    'Seyahatin her turu, kendi renginde bir çizgi ve başladığı yerde bir iğne olarak görünür. Turun kartını açmak için çizgiye tıkla. Turun olduğu bir günde günün rotası turun başladığı yere gider ve bittiği yerden devam eder. “Turlar” listesinde turun yanındaki göz simgesi (“Haritada gizle”) çizgisini senin haritandan kaldırır.',
  'help.guide.tour-map-lines.result':
    'İstediğin turlar haritada, her biri kendi renginde görünür; gizlediğin tur ise “Turlar” listesinde soluk durur.',
  'help.guide.car-stops.step.2':
    'Başlıktaki tür etiketine tıkla ve “Araba”yı seç. Form buna göre değişir: “Tarih” ve “Başlangıç zamanı” “Alış” ve “Alış saati” olur, “Bitiş tarihi” ve “Bitiş zamanı” “İade” ve “İade saati” olur, “Yol üzerindeki duraklar” alanı ise Nereden ve Nereye alanlarının altında belirir.',
  'help.guide.transport-details.goal':
    'Bir yolculuğun tüm ayrıntılarını tek yerde gör, rezervasyon kodunu kopyala, yolculuğu yeniden adlandır ya da haritada ona git.',
  'help.guide.transport-details.tip.2':
    'Escape tuşu ya da ayrıntıların dışına tıklamak onları kapatır. “Yeniden adlandır” veya silme sorusu açıksa önce o kapanır.',
  'help.guide.export-transports-csv.tip.1': 'Bu simge, sekmede en az bir yolculuk varsa çubukta görünür.',
  'help.guide.group-sort-bookings.step.1':
    '“Kartlar” veya “Liste” görünümünde üç görünüm simgesinden sonraki kaydırıcı simgesi olan “Görünüm seçenekleri”ne tıkla.',
  'help.guide.create-booking.tip.4':
    "Çevrimdışıyken rezervasyon bu cihazda kaydedilir ve yeniden çevrimiçi olunca eşitlenir. Yeni dosyalar için bağlantı gerekir, bu yüzden dosyaları kaldır ya da sonra kaydet. Formun dışına yanlışlıkla tıklarsan ya da Escape'e basarsan, yazdığın bir şey kaybolmadan önce TREK “Değişiklikler atılsın mı?” diye sorar.",
  'help.guide.booking-on-map.tip.2': 'Konaklama ilk gecesinde açılır.',
  'help.guide.export-bookings-csv.step.3':
    '“Görünüm seçenekleri”nden sonraki tablo simgesine, yani “Tablo olarak dışa aktar (CSV)”ye tıkla.',
  'help.guide.arrange-packing-list.step.3':
    "“Paylaşılan” ve “Listem” bulunan satırın en sağındaki “A'dan Z'ye” her listenin öğelerini ad sırasına göre gösterir; böylece bir şeyin listede olup olmadığını hemen görürsün. Kendi sırana dönmek için yeniden tıkla.",
  'help.guide.count-packed-pieces.step.1':
    "Satırdaki miktar rozetine, yani yanında x olan küçük sayıya tıkla, kaç tane götüreceğini yaz (örneğin 5) ve Enter'a bas.",
  'help.guide.expense-receipts.step.3':
    'Pencerenin altındaki “Kaydet”e tıkla. Dosyalar harcamayla birlikte yüklenir ve seyahatin “Dosya” sekmesinde de görünür.',
  'help.guide.files-sync-settings.step.1':
    'Çubuğun sağ ucundaki “Belge eşitleme”ye tıkla. Seyahat bir depoya bağlıysa deponun kartı sağda açılır. Birden fazla depo varsa soldaki “Bu gezi” altından istediğine tıkla.',
  'help.guide.files-sync-settings.tip.3':
    "“Anında güncelleme”, yanında “Kopyala” düğmesi olan bir bağlantıdır ve yalnızca TREK'in değişiklikleri kendiliğinden takip edemediği depolarda bulunur. Bağlantıyı depoya yapıştırırsan değişiklikler sonraki kontrolü beklemeden hemen gelir.",
  'help.guide.manage-notes.step.1':
    'Not kartının başlığındaki üç noktaya (“Diğer seçenekler”) tıkla. Menüde “Genişlet”, “Sabitle”, “Düzenle” ve “Sil” var.',
  'help.guide.note-categories.title': 'Notları kategorilere ayır',
  'help.guide.note-categories.result':
    'Notlar yeni adları ve renkleriyle görünür; “Notlar” kartı yalnızca seçtiğin kategoriyi gösterir.',
  'help.guide.roadtrip-stops.tip.5':
    'Gün planında bitiş saati olan bir durakta o saate kadar kalınır. Durağın penceresi sürüşün ne zaman yola çıktığını söyler; “Bitiş saatini kaldır” süreyi yeniden kendin belirlemene izin verir.',
  'help.guide.roadtrip-reorder.tip.2':
    'Rezerve edilmiş yolculuklar ve terminalleri rezervasyonun belirlediği yerde kalır; yalnızca yerler sürüklenebilir.',
  'help.guide.roadtrip-overnight.step.2':
    'Otelde artı yerine bir yatak simgesi görünür. Ona, yani “Konaklama olarak ekle”ye tıklayarak “Mola olarak ekle” penceresini aç. Kamp alanında olağan “Ekle” düğmesi vardır.',
  'help.guide.roadtrip-stop-fill.goal':
    'Tek bir akaryakıt veya şarj durağına kendi doluluk seviyesini ver, örneğin hızlı şarjda %80 ya da gece boyunca %100.',
  'help.guide.roadtrip-bookings.goal':
    'Rezerve edilmiş bir yolculuğun sürüşte nereye oturduğunu ve oraya en geç ne zaman varman gerektiğini gör.',
  'help.guide.roadtrip-bookings.tip.3':
    'Seyahatin hiçbir gününe denk gelmeyen bir yolculuk sürüşün parçası olmaz: panelin üstündeki bir not onu belirtir ve “Rezervasyonu aç” ile ona bir tarih verebilirsin.',
  'help.guide.roadtrip-google-import.step.4': '“Gün” altında durakların ekleneceği günü seç, sonra “İçe aktar”a tıkla.',
  'help.guide.roadtrip-hazards.step.2':
    'Pencerenin sağ sütununun altındaki “Güncel uyarılar” altında “Tehlike bölgelerini göster”i aç, sonra “Kapat”a tıkla.',
  'help.ctx.trip-tours.bullet.1':
    'Sağ sütunun üstündeki “Yer” ve “Turlar” anahtarı, yerler listesini turlarla değiştirir. Anahtar yalnızca “Turlar” eklentisi açıkken bulunur ve bu durumda turlar hiçbir zaman “Yer” listesinde görünmez.',
  'help.guide.tour-show-list.step.1':
    '“Plan” sekmesinde sağ sütunun üstündeki anahtarda “Turlar”a tıkla. Sütun artık yerler yerine turları listeler.',
  'help.guide.tour-show-list.result': 'Sağ sütun seyahatin turlarını listeler; tıkladığın tur kartında açıktır.',
  'help.guide.tour-add-to-day.tip.1':
    'Etapları olan bir turu bir güne sürüklersen aynı soru küçük bir pencerede sorulur. “İptal” planı olduğu gibi bırakır.',
  'help.guide.tour-day-times.step.2':
    "“Başlangıç”ı ayarla, “Son”u boş bırak. Alanların altındaki satır TREK'in hesapladığı bitişi gösterir: başlangıç artı turun süresi.",
  'help.guide.tour-remove-from-day.title': 'Bir turu günden çıkar',
  'help.guide.tour-filter-list.title': 'Tur listesini filtrele',
  'help.guide.tour-filter-list.tip.3':
    'Hiçbir şey kalmazsa liste “Bu filtrelerle eşleşen tur yok” der ve “Filtreleri sıfırla” hepsini temizler. Filtreler yalnızca listenin gösterdiklerini değiştirir; bir turu ya da günü asla değiştirmez.',
  'help.guide.tour-hide-on-map.tip.2':
    'Telefon haritası her zaman tüm turları gösterir ve “Turlar” sekmesinde göz simgesi yoktur: gizleme burada, “Plan” sekmesinde çalışır.',
  'help.guide.tour-import-plan-tab.tip.2':
    'İçe aktarılan tur burada listede kalır ve planlayıcıda açılmaz. Yuvarlak + ile bir güne ekle ya da orada incelemek için “Turlar” sekmesini aç.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Kart, turu okumak ve turla birlikte gelen şeyler içindir. Rotanın kendisi “Turlar” sekmesinde değiştirilir: sekmeyi aç ve “Bu seyahatin turları” altındaki tura tıkla. Tur da burada değil, orada silinir.',
  'help.guide.tour-detail-read.step.6':
    "“Açıklama” ve “Notlar”a, sonra “Köken”e kadar kaydır: TREK'te planlandı, içe aktarıldığı dosya ya da geldiği wanderer patikası, tarihiyle birlikte.",
  'help.guide.tour-rename-colour.title': 'Bir turu yeniden adlandır ve rengini değiştir',
  'help.guide.tour-rename-colour.result':
    'Tur seyahatin her yerinde yeni adıyla görünür ve çizgisi seçtiğin renkte çizilir.',
  'help.guide.tour-take-along.tip.3':
    'Dosya sunucudan gelir, bu yüzden bağlantı gerekir. Çevrimdışı oluşturulan bir turu eşitlendikten sonra indirebilirsin.',
  'help.guide.tour-copy-keep.step.4':
    '“Koleksiyon” altında listeyi seç, “Koleksiyondaki ad”ı kontrol et ve “Sakla”ya tıkla.',
  'help.guide.tour-packing-link.step.1':
    'Turun kartını aç ve “Paket listesi”ne kadar kaydır. “Paket listesi bağla”ya tıkla.',
  'help.guide.tour-packing-link.result':
    '“Listeler” sekmesinde paket listesindesin ve turun kartı orada işaretlediğin her öğeyi gösterir.',
  'help.guide.tour-files.result': 'Dosyalar tura eklenir ve turun kartından açılır.',
  'help.guide.tour-activity-link.tip.1':
    'Plan olduğu gibi kalır. İz yalnızca bağlanır; “Bağlantıyı kaldır” bağlantıyı yeniden kaldırır.',
  'help.guide.tour-activity-compare.step.3':
    'Gerçek izi planın yanında noktalı çizgiyle çizmek için “Haritada karşılaştır”a tıkla. “Karşılaştırmayı bitir” bunu yeniden kaldırır.',
  'help.guide.tour-origin-check.step.2':
    '“İçe aktarıldı” içe aktarıldığı günü gösterir. “Burada” şu anki durumunu gösterir: “İçe aktarıldığı gibi”, “TREK’te düzenlendi” veya “Yeniden planlandı, kayıtlı iz korundu”.',
  'help.ctx.trip-tour-planner.bullet.1':
    '“Turlar” sekmesi, “Turlar” eklentisi açıkken seyahatin sekme çubuğunda “Plan”ın hemen ardından gelir. Sekme bilgisayarda ve tablette bulunur. Telefonda turlar “Plan” sekmesinden görüntülenir ve günlere eklenir, ama çizilmez.',
  'help.guide.tour-open-workspace.step.1':
    'Seyahatin sekme çubuğunda “Plan”ın hemen ardından gelen “Turlar”a tıkla. Harita ekranı kaplar, her iki yanda bir panel bulunur.',
  'help.guide.tour-open-workspace.tip.2':
    'GPX, KML veya KMZ dosyalarını seyahatin turları olarak içe aktarmak için bu sekmenin herhangi bir yerine bırak.',
  'help.guide.tour-draw-route.step.4':
    'Haritanın altında “Nokta kondu” görünür. Yanındaki “Geri al” noktayı yeniden kaldırır.',
  'help.guide.tour-type-profile.title': 'Turun türünü seç',
  'help.guide.tour-type-profile.result': 'Tur, seçtiğin tür ve profile göre yönlendirilir.',
  'help.guide.tour-edit-points.step.6':
    'Panel başlığındaki “Nokta düzenlemesini geri al” ve “Nokta düzenlemesini yinele” her değişikliği tek tek geri alır veya yineler.',
  'help.guide.tour-shaping-points.step.3':
    '“Ara noktalar” altında “Şekil noktası” rozetiyle ve numarasız listelenir, böylece duraklar numaralarını korur.',
  'help.guide.tour-loop-reverse.step.1':
    '“Ara noktalar” kartının başlığındaki “Başlangıca dön”e tıkla. Tura, ilk noktasına geri dönen bir son bölüm eklenir.',
  'help.guide.tour-leg-by-hand.goal':
    'Yönlendiricinin yol bulamadığı yerde iki noktayı düz bir çizgiyle birleştir ya da bir bölümü yeniden planla.',
  'help.guide.tour-trip-places.title': 'Seyahatin bir yerini durak olarak kullan',
  'help.guide.tour-trip-places.tip.3': 'Seyahatin diğer turları hiçbir zaman durak olarak önerilmez.',
  'help.guide.tour-details-times.tip.1': 'Süreler 2:56, 2 sa 56 veya 176 dakika şeklinde yazılabilir.',
  'help.guide.tour-save.step.3':
    'Sol panelin altındaki “Kaydet”e tıkla. “Tur kaydedildi” mesajı görünür ve panelin başlığı “Turu düzenle” olur.',
  'help.guide.tour-edit-saved.step.1':
    '“Bu seyahatin turları” altında tura tıkla. Tur sol panelde “Turu düzenle” olarak açılır ve harita rotasını gösterir.',
  'help.guide.tour-summary-profile.title': 'Tur özetini ve yükseklik profilini oku',
  'help.guide.tour-summary-profile.tip.3':
    'Kürek turunda yükseklik gösterilmez, çünkü suda elde edilebilecek yükseklikler yalnızca kıyılara ait olurdu.',
  'help.guide.tour-list-manage.step.5':
    'Henüz hiçbir güne eklenmemiş turlar için “Planlanmamış”ı seç ya da “Kaynak”, “Rota sınırı” veya “Tür”e göre daralt. Her satırda kaç turun eşleştiği yazar ve toplamlar filtreyi izler.',
  'help.guide.tour-delete.step.2':
    'Turla birlikte nelerin silineceğini oku: rota, düzenlenebilir ara noktalar ve gün atamaları. “Kalıcı olarak sil”e tıkla.',
  'help.guide.tour-saved-elsewhere.step.2':
    '“Yenisini yükle”, onay aldıktan sonra senin değişikliklerinin yerine daha yeni sürümü koyar.',
  'help.ctx.trip-tour-import.bullet.1':
    "“Bu seyahatin turları”nın üstündeki + “Tur ekle”dir. “GPX veya KML içe aktar”, “Google Maps'ten yürüyüş içe aktar” ve “Başka bir geziden tur al” seçeneklerini sunar. Dosyaları “Turlar” sekmesinin herhangi bir yerine de bırakabilirsin.",
  'help.guide.tour-import-gpx.step.2':
    '“GPX veya KML içe aktar”ı seç ve her biri en fazla 10 MB olan bir ya da daha fazla .gpx, .kml veya .kmz dosyası seç.',
  'help.guide.tour-import-gpx.tip.5':
    'Yükseklik bilgisi olmayan bir dosyada “Dosyada yükseklik yok” yazar. Çizgi ve mesafe yine doğrudur, ama toplam yükselme ve toplam alçalma bilinmez.',
  'help.guide.tour-view-import.tip.2':
    'Başlıktaki indirme simgesi turu yeniden GPX dosyası olarak kaydeder, yer imi simgesi ise turu bir koleksiyonda saklar.',
  'help.guide.tour-plan-from-import.step.4':
    'Tur ara noktalarıyla birlikte düzenleyicide açılır. İstersen değiştir, sonra sütunun altındaki “Kaydet”e tıkla.',
  'help.guide.tour-restore-recorded.step.1':
    '“Bu seyahatin turları” içinde yeniden planladığın tura tıkla. Düzenleyicideki “Kaydedilmiş iz” kartı, turun kaydedildiği izin saklandığını söyler.',
  'help.guide.tour-take-over.step.1':
    'Turun ekleneceği seyahatin “Turlar” sekmesini aç. “Bu seyahatin turları”nın üstündeki + işaretine (“Tur ekle”) tıkla.',
  'help.guide.tour-take-over.tip.3':
    'Tur almak için bağlantı gerekir. Düzenleyicide kaydedilmemiş değişiklikler varsa kopya yine listeye eklenir ama açılmaz; böylece çalışman açık kalır.',
  'help.guide.tour-import-wanderer.tip.1':
    'Düğme, wanderer “Ayarlar” > “Entegrasyonlar” altında bağlandıktan sonra görünür. Öncesinde liste “Ayarlardan bağla” seçeneğini sunar.',
  'help.ctx.trip-tour-map.bullet.2':
    'Etiketteki ayırıcıdan sonra turun türüne ait anahtarlar gelir: bir turu düzenlerken “Nokta koy”, doğa yürüyüşünde “Via ferrata rotaları”, kürek turunda “Deniz işaretleri” ve kayak turunda pistler. En sondaki 3D turu 3D bir manzara üzerinde gösterir.',
  'help.guide.tour-map-layers.step.3':
    'Doğa yürüyüşünde işaretli patikalar ve numaraları için “Yürüyüş”e tıkla; bisiklet turunda bunun yerine bisiklet rotaları için “Bisiklet” bulunur. “Uydu” hava görüntüsü verir, “Harita” seni standart haritaya geri götürür.',
  'help.guide.tour-along-search.step.2':
    '“Ne aranacak”a tıkla ve istediğin türleri, aynı anda en fazla altı tane, işaretle: “Seyir noktaları”, “Zirveler”, “Kulübeler ve sığınaklar”, “İçme suyu”, “Yemek” ve daha fazlası. Liste turun türüne uyanları sunar ve tur üçü işaretli olarak başlar.',
  'help.guide.tour-along-add-stop.title': 'Tur boyunca bir yeri durak olarak ekle',
  'help.guide.tour-along-add-stop.tip.2':
    '“Yeni varış noktası olarak” eklenen bir yerde “Turu uzatır” yazar: eski varış noktası artık son nokta olmaz ve tur bu yere kadar devam eder.',
  'help.guide.tour-3d-terrain.step.5': "Düz haritaya dönmek ve planlamaya devam etmek için 3D'ye yeniden tıkla.",
  'help.guide.tour-3d-flyover.step.2':
    "“Hız” altında 1×, 2× veya 4×'i seç. 1×'te çoğu tur baştan sona yaklaşık 45 saniye sürer.",
  'help.guide.tour-map-overlays.goal':
    'Kayak veya kürek turu planlarken kayak pistlerini ve liftlerini ya da şamandıraları ve liman işaretlerini haritanın üzerinde göster.',
  'help.guide.tour-map-overlays.tip.3':
    'Bir katman yüklenmeyi bıraktığında anahtarında ! işareti ve bir açıklama görünür; harita ve rotan o katman olmadan da çalışır.',
  'help.guide.tour-multi-day.title': 'Birkaç güne yayılan bir tur planla',
  'help.guide.tour-multi-day.tip.1':
    '“Etabı burada bitir” günübirlik turda da çalışır: tur kendiliğinden çok günlü bir tura dönüşür. İlk ve son durak ile şekil noktaları bir etabı bitiremez.',
  'help.guide.tour-stages-on-days.step.2': 'İlk etaba başlayacağın günü seç.',
  'help.guide.tour-stages-on-days.tip.4':
    'Gün planında her etap, kendi mesafesi ve süresiyle “Etap N” olarak görünür. “Plan” sekmesinde günlerin üstündeki “Geri al”, tüm dağıtımı tek adımda geri alır.',
  'help.ctx.trip-tour-hike.bullet.5':
    "Doğa yürüyüşünde sol alttaki harita düğmeleri satırında “Via ferrata rotaları”, yakındaki via ferrata'ları gösterir. Bir via ferrata'nın kartı onu rotaya ayrı bir bölüm olarak ekler.",
  'help.guide.tour-hike-plan.step.5':
    "“Detaylar” altında “En yüksek patika zorluğu”nu aç ve patikaların ne kadar zorlaşabileceğini T1'den (Yürüyüş) T6'ya (Çok zor yüksek dağ yürüyüşü) kadar seç. Rota bu sınır içinde yeniden planlanır.",
  'help.guide.tour-hike-trail-details.goal':
    "OpenStreetMap'in bir yürüyüşün üzerindeki yollar için kaydettiklerini oku ve bu kesimleri haritada bul.",
  'help.guide.tour-hike-trail-details.tip.2':
    'Yürüyüşün sınırından yüksek bir derecenin satırında “Sınırın üstünde” rozeti görünür.',
  'help.guide.tour-hike-round.step.5':
    '“Bu turu al”a tıkla; planlanan rotanın değiştirilip değiştirilmeyeceği sorulunca “Değiştir”e tıkla.',
  'help.guide.tour-hike-compare-ways.step.2':
    '“Bu bölüm için diğer yollar” haritanın üzerinde “Mevcut yol” ile “Yol A”, “Yol B” vb. şeklinde açılır. Her yol haritada kendi renginde çizilir ve bir satırın üzerine gelmek o yolun çizgisini vurgular.',
  'help.guide.tour-ferrata-add.goal': "Yürüyüşünün çevresindeki via ferrata'ları bul ve birini rotanın parçası yap.",
  'help.guide.tour-ferrata-add.tip.2':
    "Via ferrata'lar yalnızca doğa yürüyüşlerinde sunulur. Rotanın zaten tırmandığı bir via ferrata'nın kartında “Tura ekle” yerine “Turun parçası” yazar.",
  'help.guide.tour-run-plan.step.4':
    'Başlangıç ve bitişi haritada belirle ya da “Gezi yerleri” ile seç. Temponun altında koşu süresini görürsün: mesafe çarpı tempo.',
  'help.guide.tour-run-ways.goal':
    'Bir koşunun ne kadarının asfaltsız olduğunu ve patikalarının ne kadar zorlaştığını kontrol et.',
  'help.ctx.trip-tour-walk.summary':
    'Duraktan durağa yaya bir tur, “Turlar” sekmesinde planlanır: her durakta ne kadar kalacağın, hangi durakların önemli olduğu, yol boyunca görülecek yerler ve yürüyüş gününde her durağa ne zaman varacağın; varış saatleri çalışma saatleriyle karşılaştırılır.',
  'help.guide.tour-walk-plan.step.1':
    'Sol sütunun üstündeki “Yeni tur planla”ya tıkla, sonra “Tur türü”nü aç ve “Şehir / gezi yürüyüşü”nü seç.',
  'help.guide.tour-walk-plan.tip.3':
    'Bir durağın “Diğer işlemler” menüsündeki “Yerden ayır” yalnızca seyahat yeriyle bağlantıyı kaldırır. Yerin kendisi seyahatte kalır.',
  'help.guide.tour-walk-sights.step.5':
    '“Mola olarak ekle”ye tıkla. Bir not yürüyüşün ne kadar uzadığını gösterir ve yanında “Geri al” bulunur.',
  'help.guide.tour-walk-day-times.step.2':
    'Yürüyüşe o günde bir başlangıç saati ver: “Plan” sekmesinde gündeki yürüyüşe sağ tıkla, “Düzenle”yi seç ve bir “Başlangıç” gir.',
  'help.guide.tour-walk-google-import.title': 'Bir Google Maps yürüyüş rotasını şehir yürüyüşüne dönüştür',
  'help.guide.tour-walk-google-import.tip.3':
    "Yalnızca duraklar alınır, Google Maps'te çizilen çizgi alınmaz. Kısa bir maps.app.goo.gl bağlantısını açmak için bağlantı gerekir.",
  'help.guide.tour-walk-check-off.tip.1':
    'İşaretler güne göre kaydedilir: yürüyüşü tur listesinden değil, planda kendi gününden aç.',
  'help.ctx.trip-tour-bike.bullet.3':
    '“Ara noktalar” altındaki “Zemin ve yollar” kartı rotanın hangi zeminde ilerlediğini gösterir: zeminler, yol türleri ve asfaltsız olduğu bilinen pay. Kesimlerini haritada vurgulamak için bir satıra tıkla.',
  'help.guide.tour-bike-profile.step.5':
    'Sağdaki “Tur özeti” içinde “Sürüş süresi (tahmini)”ni oku. Nasıl hesaplandığını görmek için bilgi simgesinin üzerine gel.',
  'help.guide.tour-bike-surfaces.title': 'Bir bisiklet turunun zeminlerini gör',
  'help.guide.tour-bike-surfaces.tip.2':
    '“Yol” profilinde çubukların üstündeki bir uyarı, rotanın ne kadarının asfaltsız olduğunun bilindiğini söyler. “Haritada göster” bu kesimleri işaretler.',
  'help.guide.tour-bike-mtb-grades.result':
    'Harita seçtiğin derecedeki patikaları işaretler ve turun hangi kesimlerinin zor olduğunu öğrenirsin.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Branşın altında pist yönlendiricisinin seçenekleri yer alır; yalnızca branşının kullandıkları görünür: “En zor pistler”, “Tercih et”, “Tempo”, “Teleferik kullan” gibi anahtarlar ve binmek istemediğin lift türleri için “Hariç tut”. Her değişiklik turu yeniden planlar.',
  'help.guide.tour-ski-plan.step.3':
    '“Branş” altında ne yapacağını seç: “Alp disiplini”, “Snowboard”, “Kayaklı koşu”, “Dağ kayağı”, “Kar ayakkabısı” veya “Kış yürüyüşü”. Hiçbiri önceden seçili değildir ve branş seçilmeden tur kaydedilemez.',
  'help.guide.tour-ski-plan.result':
    '“Bu seyahatin turları” içinde kayıtlı bir “Kayak ve kış” turu; bölümleri haritalanmış pistleri, liftleri ve parkurları izler ve süresi “Tur özeti”nde hesaplanır.',
  'help.guide.tour-ski-options.tip.1': 'Her değişiklik turu bölüm bölüm yeniden planlar.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Hiçbir çözüm sana uymuyorsa “Düz çiz”e tıkla. Bölüm, iki noktası arasında düz bir çizgi olur.',
  'help.guide.tour-ski-summary.step.1':
    'Ara noktaların altında “Pist rotası” kartını bul. Kartı daraltmak ya da yeniden açmak için başlığına tıkla.',
  'help.guide.tour-ski-pistes-layer.title': 'Pistleri haritada göster',
  'help.guide.tour-ski-pistes-layer.result': 'Pistler turun altında çizilir ve renklerini okuyabilirsin.',
  'help.guide.tour-ski-import.step.6':
    '“Kayak izini sınıflandır” penceresinde doğru branşı veya tekniği seç ve “Kaydet”e tıkla.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Her noktada rolü bir rozet olarak görünür: “Suya giriş”, “Sudan çıkış”, “Suya yeniden giriş” veya “Son çıkış”. Bir noktanın altında ondan sonra gelen şey görünür: elle çizilen bir bölüm, bir taşıma, bir kilit ya da bir bölümün neden planlanamadığı.',
  'help.guide.tour-paddle-setup.step.2': '“Tur türü”nü aç ve “Kürek turu”nu seç: suda, kano, kayak veya SUP ile.',
  'help.guide.tour-paddle-setup.tip.3':
    '“Tur boyunca” kürek turunda önce “Suya iniş noktaları”, “Tekne kiralama” ve “İçme suyu” arar.',
  'help.guide.tour-paddle-water-route.step.4':
    "TREK'in planlayamadığı bölüm kırmızıya döner ve nedenini söyler, örneğin bölge için henüz su verisi olmadığını. Şimdilik elle çizmek için “Düz çiz”e tıkla.",
  'help.guide.tour-paddle-portage.goal':
    'Tekneyi taşıdığın bir kesimi işaretle; kesim, tekneden çıkıp yeniden binme süresiyle birlikte kara olarak sayılır.',
  'help.guide.tour-paddle-portage.tip.3':
    '“Süre tahmini” kartında kendi “Taşıma hızı”nı ayarlayana kadar taşıma 2 km/sa olarak hesaplanır.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK kilit çizelgelerini bilmez. Süreler yalnızca senin girdiğin değerlerdir, bu yüzden kilidin çalışma saatlerini kendin kontrol et.',
  'help.guide.tour-paddle-time.step.3':
    '“Su” satırı, “Kürek hızı”nla sudaki mesafeye göre hesaplanır. Hızı sütunun üstündeki “Kürek hızı” alanından değiştirebilirsin.',
  'help.guide.tour-paddle-wind.goal': 'Turun başlangıcındaki tahmini rüzgârı, kürek çekeceğin gün için gör.',
  'help.guide.tour-paddle-wind.tip.4':
    'Tahmin değerinin görünmemesi güvenli olduğu anlamına gelmez. Koşulları yerinde kontrol et.',
  'help.guide.tour-paddle-checklist.step.5':
    'Sütunun altında yola çıkmadan önce “Suda güvenlik”i okumak için “Kürek çekmenin riskleri vardır”a tıkla.',
  'help.guide.tour-paddle-track-marks.goal':
    'Saatinden bir kürek izi içe aktar ve tekneyi nerede taşıdığını, nerede kilitten geçtiğini ekle.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Tam olarak ize tıkla: çizgiden çok uzağa yapılan tıklama kabul edilmez ve kart bunu belirtir.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Her bölüm, “Ara noktalar” kartında rotanın adı, bir erişim noktası ve uzunluğuyla bir rozet olarak görünür. Hiçbir at rotasının kapsamadığı bir kesimde “Elle, denetlenmemiş” yazar.',
  'help.guide.tour-horse-plan.step.4':
    'Listeden bir rotaya tıkla. Rota kendi haritasında, bölümleri numaralanmış olarak açılır.',
  'help.guide.tour-horse-plan.tip.4':
    'Sol sütunun başlığındaki “Nokta düzenlemesini geri al” bir bölümün tamamını tek adımda geri alır.',
  'help.guide.tour-horse-gap.result':
    'Sürüşte artık boşluk kalmaz ve köprülenen kesim elle çizildi olarak işaretlenir.',
  'help.guide.tour-horse-recorded.step.3': '“1 turu içe aktar”a tıkla.',
  'help.guide.dissolve-fusion.step.3': 'Açılan pencerede “Ayır” ile onaylayın.',
};

export default help;
