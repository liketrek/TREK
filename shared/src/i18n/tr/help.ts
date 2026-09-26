import type { TranslationStrings } from '../types';

// English fallback until 'tr' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Bu ekran için yardım',
  'help.center.title': 'Yardım',
  'help.center.onThisScreen': 'Bu ekranda',
  'help.center.screens': 'Ekranlar',
  'help.center.thisScreen': 'Bu ekran',
  'help.center.subScreens': 'Alt ekranlar: {count}',
  'help.center.subScreensLabel': 'Alt ekranlar',
  'help.center.guidesCount': '{count} kılavuz',
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
  'help.center.step': '{n}. adım',
  'help.center.stepsLabel': 'Adımlar',
  'help.center.stepOf': '{total} adımdan {n}.',
  'help.center.screenshot': 'Ekran görüntüsü',
  'help.center.result': 'Sonuç',
  'help.center.tips': 'Bilmekte fayda var',
  'help.center.related': 'İlgili',
  'help.center.openDocs': "Yardım ve Belgeler'de aç",
  'help.center.docsSection': 'Belgelerde',
  'help.center.noContext': 'Bu ekran için henüz kılavuz yok.',
  'help.center.noContextHint': 'Belgelerde arayın ya da ne aradığınızı bize söyleyin.',
  'help.center.feedback': 'Eksik bir şey mi var?',
  'help.center.feedbackLink': "GitHub'da bize söyleyin",
  'help.center.discord': "Discord'da sorun",
  'help.center.quick': 'Hızlı',
  'help.center.guide': 'Kılavuz',
  'help.center.tour': 'Gösterim',
  'help.center.imageAlt': '“{title}” kılavuzunun {n}. adımı',

  // ctx
  'help.ctx.dashboard.title': 'Pano',
  'help.ctx.dashboard.summary':
    'Pano, her seyahatin giriş kapısıdır. Üstteki biniş kartı süren ya da sıradaki seyahati öne çıkarır, altındaki satır şimdiye kadar ne kadar yol aldığınızı sayar, kartlar ise planladığınız, arşivlediğiniz ya da tamamladığınız her şeyi listeler.',
  'help.ctx.dashboard.bullet.1':
    'Biniş kartı: süren ya da sıradaki seyahat; tarihleri, yolcuları, yerleri ve geri sayımıyla. Seyahati açmak için tıklayın.',
  'help.ctx.dashboard.bullet.2':
    'Seyahat istatistikleri: tüm seyahatlerinizde ziyaret edilen ülkeler, seyahatler, yolda geçen günler ve uçulan mesafe.',
  'help.ctx.dashboard.bullet.3':
    'Planlanan, Arşivlendi ve Tamamlandı olarak süzülen seyahat kartları, ızgara ya da liste halinde. Düzenlemek, çoğaltmak, arşivlemek ve silmek için bir kartın üzerine gelin.',
  'help.ctx.dashboard.bullet.4':
    'Sağdaki bileşenler: döviz çevirici, dünya saatleri, yaklaşan rezervasyonlar ve koleksiyonlar. Her biri kapatılabilir.',
  'help.ctx.dashboard.bullet.5': '“Yeni Seyahat” kartı ve sağ alt köşedeki düğme, ikisi de yeni bir seyahat başlatır.',

  // create-trip
  'help.guide.create-trip.title': 'Seyahat oluşturma',
  'help.guide.create-trip.goal': 'Ad, tarihler ve kapak fotoğrafıyla yeni bir seyahat başlatın.',
  'help.guide.create-trip.step.1':
    '“Yeni Seyahat”e tıklayın. Seyahatlerinizin sonundaki kart ile sağ alt köşedeki düğme aynı işi yapar.',
  'help.guide.create-trip.step.2': 'Seyahate bir ad verin. Zorunlu tek alan budur; gerisini sonradan ekleyebilirsiniz.',
  'help.guide.create-trip.step.3':
    'Başlangıç ve bitiş tarihi seçin. TREK her tarih için bir gün oluşturur, böylece rotanız doldurulmaya hazır olur.',
  'help.guide.create-trip.step.4':
    "İsteğe bağlı: bir kapak fotoğrafı ekleyin. Kendi fotoğrafınızı yükleyin, sürükleyip bırakın ya da hedefi Unsplash'ta arayın.",
  'help.guide.create-trip.step.5': '“Yeni Seyahat Oluştur”a tıklayın.',
  'help.guide.create-trip.result': 'Seyahat panonuzda görünür. Sıradaki seyahatinizse üstteki biniş kartını devralır.',
  'help.guide.create-trip.tip.1':
    'Tarihler sonradan değiştirilebilir. Rezervasyonlar zaten varsa TREK, günlerle birlikte taşınıp taşınmayacağını sorar.',
  'help.guide.create-trip.tip.2':
    'Burada seçtiğiniz seyahat para birimi, her harcamanın çevrileceği birimdir. Gideceğiniz yerin para birimini seçin.',

  // edit-trip
  'help.guide.edit-trip.title': 'Seyahati düzenleme',
  'help.guide.edit-trip.goal': 'Bir seyahati yeniden adlandırın, tarihlerini değiştirin ya da ayarlarını düzenleyin.',
  'help.guide.edit-trip.step.1': 'Seyahat kartının (ya da biniş kartının) üzerine gelin ve kaleme tıklayın.',
  'help.guide.edit-trip.step.2':
    'Gerekeni değiştirin: ad, açıklama, tarihler, kapak, para birimi, hatırlatıcı ya da üyeler.',
  'help.guide.edit-trip.step.3': '“Güncelle”ye tıklayın.',
  'help.guide.edit-trip.result': 'Kart, seyahatin her üyesi için anında güncellenir.',
  'help.guide.edit-trip.tip.1':
    'Rezervasyonu olan bir seyahatin tarihlerini taşımak, rezervasyonların da taşınıp taşınmayacağını soran ikinci bir adım açar.',

  // cover-image
  'help.guide.cover-image.title': 'Kapak fotoğrafı belirleme',
  'help.guide.cover-image.goal': 'Seyahate, kartında ve biniş kartında görünen bir görsel verin.',
  'help.guide.cover-image.step.1': 'Kartındaki kalemle seyahatin düzenleme formunu açın.',
  'help.guide.cover-image.step.2':
    '“Kapak Görseli” altında bir fotoğrafı bırakın, yüklemek için tıklayın ya da Unsplash aramasına bir hedef yazın.',
  'help.guide.cover-image.step.3': 'Bir fotoğraf seçin ve “Güncelle”ye tıklayın.',
  'help.guide.cover-image.result':
    'Fotoğraf seyahatle birlikte kaydedilir ve seyahatin listelendiği her yerde görünür.',
  'help.guide.cover-image.tip.1':
    'Unsplash aramasından gelen fotoğraflara otomatik olarak fotoğrafçı bilgisi eklenir; kendi yüklemeleriniz sunucunuzda kalır.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Seyahati çoğaltma',
  'help.guide.duplicate-trip.goal': 'Bir seyahati yenisi için şablon olarak yeniden kullanın.',
  'help.guide.duplicate-trip.step.1': 'Kartın üzerine gelin ve çoğaltma simgesine tıklayın.',
  'help.guide.duplicate-trip.step.2': 'Nelerin kopyalanıp nelerin kopyalanmayacağını okuyun, sonra onaylayın.',
  'help.guide.duplicate-trip.result':
    'Orijinalin yanında, yeniden adlandırılmaya ve tarihlendirilmeye hazır bir kopya belirir.',
  'help.guide.duplicate-trip.tip.1':
    'Günler, yerler, rezervasyonlar, bütçe kalemleri, valiz listeleri ve gün notları kopyalanır. Üyeler, sohbet, anketler, dosyalar ve paylaşım bağlantıları kopyalanmaz.',

  // archive-trip
  'help.guide.archive-trip.title': 'Seyahati arşivleme ve geri alma',
  'help.guide.archive-trip.goal': 'Bir seyahati silmeden kenara kaldırın ve sonra geri getirin.',
  'help.guide.archive-trip.step.1': 'Kartın üzerine gelin ve “Arşivle”ye tıklayın.',
  'help.guide.archive-trip.step.2': 'Yeniden görmek için kartların üstündeki süzgeci “Arşivlendi” yapın.',
  'help.guide.archive-trip.step.3': '“Planlanan”a geri taşımak için karttaki “Geri al”a tıklayın.',
  'help.guide.archive-trip.result':
    'Arşivlenen seyahatler her şeyi korur. Yalnızca panoyu ve tüm seyahatler takvim akışını meşgul etmeyi bırakırlar.',

  // delete-trip
  'help.guide.delete-trip.title': 'Seyahati silme',
  'help.guide.delete-trip.goal': 'Bir seyahati kalıcı olarak kaldırın.',
  'help.guide.delete-trip.step.1': 'Kartın üzerine gelin ve çöp kutusuna tıklayın.',
  'help.guide.delete-trip.step.2':
    'Onaylayın. İletişim kutusu seyahatin adını gösterir, böylece doğru olanı sildiğinizden emin olursunuz.',
  'help.guide.delete-trip.result':
    'Seyahat; günleri, yerleri, rezervasyonları ve dosyalarıyla birlikte gider. Geri alma yoktur; emin değilseniz arşivleyin.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Tamamlanan seyahatleri bulma, ızgara ve liste arasında geçiş',
  'help.guide.filter-and-view.goal': 'Biten ya da arşivlenen seyahatleri görün ve sevdiğiniz düzeni seçin.',
  'help.guide.filter-and-view.step.1':
    'Kartların üstündeki “Planlanan”, “Arşivlendi” ve “Tamamlandı”yı kullanın. Tamamlandı, bitiş tarihi geçmiş her seyahattir.',
  'help.guide.filter-and-view.step.2':
    'Sıkışık bir listeye geçmek için liste simgesine tıklayın; ızgara için yeniden tıklayın.',
  'help.guide.filter-and-view.result': 'Pano, bu cihazdaki düzeninizi hatırlar.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Tüm seyahatlere takviminizde abone olma',
  'help.guide.calendar-feed.goal':
    'Her etkin seyahatin günlerini ve rezervasyonlarını takvim uygulamanızda, hep eşitlenmiş olarak görün.',
  'help.guide.calendar-feed.step.1': 'Görünüm düğmesinin yanındaki takvim simgesine tıklayın.',
  'help.guide.calendar-feed.step.2':
    '“Enable calendar subscription”a tıklayın. TREK özel bir akış bağlantısı oluşturur.',
  'help.guide.calendar-feed.step.3':
    "Akışı düğmelerden biriyle ekleyin (Google, Apple, Outlook) ya da bağlantıyı URL'lere abone olabilen herhangi bir takvim uygulamasına kopyalayın.",
  'help.guide.calendar-feed.result':
    'Her etkin seyahat takviminizde görünür ve kendiliğinden güncellenir. Arşivlenen seyahatler ve 90 günden uzun süre önce biten seyahatler dışarıda kalır.',
  'help.guide.calendar-feed.tip.1':
    'Bağlantı bir sırdır. Elinde olan herkes akışı okuyabilir; sızarsa aynı iletişim kutusundan iptal edin.',

  // widgets
  'help.guide.widgets.title': 'Pano bileşenlerini seçme',
  'help.guide.widgets.goal': 'İstatistik satırını ve sağdaki bileşenleri gösterin ya da gizleyin.',
  'help.guide.widgets.step.1': 'Sağ üstteki avatar menüsünü açın ve “Ayarlar”ı seçin.',
  'help.guide.widgets.step.2': '“Appearance” sekmesine geçin.',
  'help.guide.widgets.step.3':
    '“Dashboard widgets” altında her bileşeni açın ya da kapatın. Masaüstü ve mobil ayrı ayrı ayarlanır.',
  'help.guide.widgets.step.4': 'Panoya geri dönün. Değişiklik anında uygulanır.',
  'help.guide.widgets.result':
    'Gizlenen bileşenler seyahatlerinize yer açar; düzeni ortalamak için sağ sütunun tamamını kapatın.',
  'help.guide.widgets.link': 'Görünüm ayarlarını aç',

  // currency-widget
  'help.guide.currency-widget.title': 'Döviz çevirme',
  'help.guide.currency-widget.goal': 'Bir tutarı güncel kurlarla iki para birimi arasında çevirin.',
  'help.guide.currency-widget.step.1': 'Tutarı yazın ve iki para birimini seçin.',
  'help.guide.currency-widget.step.2': 'Aradaki ok çifti yer değiştirir; dairesel ok kuru yeniler.',
  'help.guide.currency-widget.result': 'Para birimi çiftiniz hesabınızda hatırlanır, yani her cihazda aynıdır.',
  'help.guide.currency-widget.tip.1': "Kurlar Avrupa Merkez Bankası'ndan gelir ve günde bir kez güncellenir.",

  // timezones-widget
  'help.guide.timezones-widget.title': 'Dünya saatleri ekleme',
  'help.guide.timezones-widget.goal': 'Gideceğiniz yerlerdeki yerel saati göz önünde tutun.',
  'help.guide.timezones-widget.step.1': '“Saat dilimleri” bileşeninde + simgesine tıklayın ve bir şehir arayın.',
  'help.guide.timezones-widget.step.2': 'Bir saati yanındaki × ile kaldırın.',
  'help.guide.timezones-widget.result': 'Saatleriniz hesabınızla birlikte kaydedilir.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay kişisel izin planlayıcınızdır: yılda kaç izin gününüz var, hangilerini kaydettiniz ve ne kadar kaldı. Izgara tüm yılı tek bakışta gösterir; kenar çubuğunda yıl seçici, birlikte planladığınız kişiler, sizinle paylaşılan takvimler, açıklama ve izin hakkınız yer alır.',
  'help.ctx.vacay.bullet.1':
    'Yıl ızgarası: on iki ay kartı, gün başına bir hücre. Bir günü kaydetmek veya silmek için tıklayın. Küçük mavi nokta, bir seyahatin zaten kapsadığı günleri işaretler.',
  'help.ctx.vacay.bullet.2':
    'Alttaki araç çubuğu: Tatil veya Şirket Tatili modu, ayrıca tıklamanın ne kaydedeceğini değiştiren Yarım gün ve Serbest zaman anahtarları.',
  'help.ctx.vacay.bullet.3':
    'Hakediş: yıl için günleriniz, kaçının kullanıldığı ve kaçının kaldığı, önceki dönemden devirle birlikte.',
  'help.ctx.vacay.bullet.4':
    'Kişiler, planınızla birleşen insanlardır; her biri kendi renginde. Paylaşılan Takvimler, başkalarının izin günlerini gösteren salt okunur halkalardır.',
  'help.ctx.vacay.bullet.5':
    'Ayarlar hafta sonlarını, hafta başlangıcını, devri, izin yılınızı, şirket tatillerini ve resmi tatil ya da okul tatili takvimlerini kapsar.',
  // log-day
  'help.guide.log-day.title': 'İzin günü kaydetme',
  'help.guide.log-day.goal': 'Yıl ızgarasında bir izin günü işaretleyin ve bakiyenin değişmesini izleyin.',
  'help.guide.log-day.step.1':
    'Alttaki araç çubuğuna bakın: sizin renginizdeki sol düğme, tıklamanın sizin için bir izin günü kaydedeceği anlamına gelir.',
  'help.guide.log-day.step.2':
    'Herhangi bir ay kartında bir güne tıklayın. Renginizle dolar ve Kullanılan bir gün fazla sayar.',
  'help.guide.log-day.step.3': 'Silmek için aynı güne yeniden tıklayın.',
  'help.guide.log-day.result':
    'Gün kaydedilir; Gün, Kullanılan ve Kalan hemen güncellenir ve planınızla birleşen herkes bunu canlı görür.',
  'help.guide.log-day.tip.1': "Ayarlar'da Hafta Sonlarını Engelle açıkken hafta sonları kaydedilemez.",
  'help.guide.log-day.tip.2':
    'Hücredeki mavi nokta, seyahatlerinizden birinin o günü kapsadığı anlamına gelir; böylece izin ve seyahatin nerede çakıştığını görürsünüz.',
  // half-day
  'help.guide.half-day.title': 'Yarım gün kaydetme',
  'help.guide.half-day.goal': 'Tam bir izin günü harcamadan bir öğleden sonra izin alın.',
  'help.guide.half-day.step.1':
    "Araç çubuğunda Yarım gün'ü açın. Turuncu nokta, yarım günün ızgarada aldığı işarettir.",
  'help.guide.half-day.step.2': 'Bir güne tıklayın. 0,5 olarak kaydedilir ve köşesinde turuncu nokta taşır.',
  'help.guide.half-day.step.3':
    "İşiniz bitince Yarım gün'ü yeniden kapatın; farklı ayarlarla bir yarım güne tıklamak onu yerinde dönüştürür.",
  'help.guide.half-day.result':
    'Kullanılan 0,5 artar. Yarım gün ile Serbest zaman bağımsızdır, yani yarım telafi günü de mümkündür.',
  'help.guide.half-day.tip.1':
    'Araç çubuğu her zaman bir sonraki tıklamanızın koyacağı işareti gösterir; kaydetmeden önce kontrol edebilirsiniz.',
  // comp-day
  'help.guide.comp-day.title': 'Telafi veya esnek zaman kaydetme',
  'help.guide.comp-day.goal': 'İzin günü harcamayan telafi izni kullanın.',
  'help.guide.comp-day.step.1':
    "Araç çubuğunda Serbest zaman'ı açın. Taralı disk, telafi gününün ızgaradaki görünümüdür.",
  'help.guide.comp-day.step.2': 'Bir güne tıklayın. Düz bir blok yerine renginizde çapraz taramayla dolar.',
  'help.guide.comp-day.result': "Telafi günleri izin hakkı kutucuklarının yanında sayılır ve Kalan'ı asla azaltmaz.",
  'help.guide.comp-day.tip.1':
    'Geri alınan fazla mesai, esnek çalışma, telafi izni: izin olmayan ama boş olan her şey buraya girer.',
  // entitlement
  'help.guide.entitlement.title': 'İzin hakkınızı ayarlama',
  'help.guide.entitlement.goal': "Vacay'e yılda kaç izin gününüz olduğunu söyleyin.",
  'help.guide.entitlement.step.1': 'Kenar çubuğunda Hakediş altındaki Gün kutucuğuna tıklayın.',
  'help.guide.entitlement.step.2': "Gün sayınızı yazın ve Enter'a basın.",
  'help.guide.entitlement.result': 'Kalan; izin hakkınız, varsa devir ve kullandığınız günlerden yeniden hesaplanır.',
  'help.guide.entitlement.tip.1':
    'Her yılın kendi izin hakkı vardır; buradaki değişiklik yalnızca seçili yılı etkiler.',
  // years
  'help.guide.years.title': 'Yıl ekleme ve yıllar arasında geçiş',
  'help.guide.years.goal': 'Gelecek yılı şimdiden planlayın ya da geçen yıla dönüp bakın.',
  'help.guide.years.step.1':
    "Sonraki yılı eklemek için yılın sağındaki +'ya, öncekini eklemek için soldaki +'ya tıklayın.",
  'help.guide.years.step.2': 'Yıllar arasında oklarla ya da alttaki yıl etiketleriyle geçiş yapın.',
  'help.guide.years.step.3':
    'Bir yılı kaldırmak için etiketinin üzerine gelin ve küçük eksiye tıklayın. Kayıtları onunla birlikte gider, dikkatle onaylayın.',
  'help.guide.years.result': 'Her yıl kendi izin hakkını ve kayıtlarını tutar; devir onları birbirine bağlar.',
  // company-holidays
  'help.guide.company-holidays.title': 'Şirket tatillerini işaretleme',
  'help.guide.company-holidays.goal': 'Tüm şirketin tatil olduğu günleri kimsenin izin hakkını harcamadan bloke edin.',
  'help.guide.company-holidays.step.1':
    "Ayarlar'ı açın ve Şirket Tatilleri'nin açık olduğunu kontrol edin. Varsayılan olarak açıktır; araç çubuğu modu yalnızca açıkken sunar.",
  'help.guide.company-holidays.step.2': 'Izgaraya dönüp araç çubuğunu Şirket Tatili moduna alın.',
  'help.guide.company-holidays.step.3': 'Günlere tıklayın. Kehribar rengine döner ve açıklamada görünürler.',
  'help.guide.company-holidays.result': "Şirket tatilleri planla birleşen herkese görünür ve Kalan'ı asla azaltmaz.",
  'help.guide.company-holidays.tip.1':
    'Birleşen herkes şirket tatillerini düzenleyebilir; kimin sürdüreceğinde anlaşın.',
  // public-holidays
  'help.guide.public-holidays.title': 'Resmi tatilleri gösterme',
  'help.guide.public-holidays.goal': 'Ülkenizin veya bölgenizin resmi tatillerini ızgaraya koyun.',
  'help.guide.public-holidays.step.1': "Ayarlar'ı açın ve Resmi Tatiller'i açın.",
  'help.guide.public-holidays.step.2':
    "Takvim ekle'ye tıklayın, ülkeyi ve önemliyse bölgeyi seçin. İsterseniz renk ve etiket verin.",
  'help.guide.public-holidays.step.3': "Ayarlar'ı kapatın. Tatiller ızgarada ve açıklamada görünür.",
  'help.guide.public-holidays.result': 'Resmi tatiller takvimin renginde işaretlenir ve izin hakkınızdan asla düşmez.',
  'help.guide.public-holidays.tip.1':
    'Birden fazla takvim ekleyebilirsiniz, örneğin kendi bölgeniz ve birleştiğiniz bir iş arkadaşınızınki.',
  // school-holidays
  'help.guide.school-holidays.title': 'Okul tatillerini gösterme',
  'help.guide.school-holidays.goal': 'Bölgenizin okul tatillerini kendi izin günlerinizin yanında görün.',
  'help.guide.school-holidays.step.1': "Ayarlar'ı açın ve School Holidays'i açın.",
  'help.guide.school-holidays.step.2':
    "Takvim ekle'ye tıklayın ve ülkeyi seçin. Ülke takvimini bölüyorsa bölgeyi veya grubu da seçin.",
  'help.guide.school-holidays.step.3': "Ayarlar'ı kapatın. Her tatil, günlerinin altında renkli bir şerit alır.",
  'help.guide.school-holidays.result': 'Okul tatilleri yalnızca görseldir: kimsenin izin hakkını azaltmaz.',
  'help.guide.school-holidays.tip.1':
    'Bölgeniz yok mu? Yöneticiniz Yönetici, Kişiselleştirme, Okul tatilleri altında okul tatillerini elle yönetebilir.',
  // weekends
  'help.guide.weekends.title': 'Hafta sonlarını engelleme ve hafta başlangıcını ayarlama',
  'help.guide.weekends.goal': 'Hafta sonlarını sayımın dışında tutun ve haftayı alıştığınız günde başlatın.',
  'help.guide.weekends.step.1': "Ayarlar'ı açın.",
  'help.guide.weekends.step.2': "Hafta Sonlarını Engelle'yi açın ve hangi günlerin hafta sonunuz sayılacağını seçin.",
  'help.guide.weekends.step.3': "Hafta başlangıcı altında Pazartesi veya Pazar'ı seçin.",
  'help.guide.weekends.result': 'Engellenen günler ızgarada gri görünür ve yanlışlıkla kaydedilemez.',
  // leave-year
  'help.guide.leave-year.title': 'İzin yılınızı ayarlama',
  'help.guide.leave-year.goal':
    'İzin hakkınızı Ocak ile Aralık arası yerine mali yıl üzerinden ya da işe giriş tarihinden itibaren sayın.',
  'help.guide.leave-year.step.1': "Ayarlar'ı açın ve Tatil yılı'nı bulun.",
  'help.guide.leave-year.step.2':
    'Takvim, Mali (başladığı ay ve günle) veya İşe giriş (işe alındığınız tarihle) seçeneğini seçin.',
  'help.guide.leave-year.result':
    'İzin hakkı, kullanılan günler ve devir bu dönemi izler; ızgara dönemin ilk ayıyla başlar.',
  'help.guide.leave-year.tip.1':
    'Bu ayar kişiseldir: birleşik bir planda herkes kendi izin yılını ve rakamlarını korur.',
  // carry-over
  'help.guide.carry-over.title': 'Kullanılmayan günleri devretme',
  'help.guide.carry-over.goal': 'Bir dönemin sonunda kalanı sonrakine ekleyin.',
  'help.guide.carry-over.step.1': "Ayarlar'ı açın.",
  'help.guide.carry-over.step.2': "Devret'i açın.",
  'help.guide.carry-over.result':
    'Devredilen miktar tüm yıllarınız için yeniden hesaplanır ve izin hakkının altında gösterilir.',
  'help.guide.carry-over.tip.1': 'Kapatmak her devir bakiyesini sıfırlar.',
  // invite
  'help.guide.invite.title': 'Biriyle birlikte planlama',
  'help.guide.invite.goal':
    'Planınızı başka bir TREK kullanıcısıyla birleştirin ki birbirinizin izin günlerini tek ızgarada görün.',
  'help.guide.invite.step.1': 'Kişiler panelindeki kişi simgesine tıklayın.',
  'help.guide.invite.step.2': 'Kullanıcıyı seçin ve daveti gönderin.',
  'help.guide.invite.step.3': 'Bir bildirim alır ve kabul eder. O zamana kadar davet beklemede görünür.',
  'help.guide.invite.result':
    'İki plan birleşir: herkesin bir rengi olur, birbiriniz için gün kaydedebilirsiniz ve her şey canlı eşitlenir.',
  'help.guide.invite.tip.1':
    "Birleşmeyi geri almak için Ayarlar'daki Ayır'ı kullanın. Herkesin kayıtları kendi planına döner.",
  'help.guide.invite.tip.2': 'Diğer kişi yalnızca günlerinizi görecekse, birleştirmek yerine takviminizi paylaşın.',
  // share-calendar
  'help.guide.share-calendar.title': 'Takviminizi salt okunur paylaşma',
  'help.guide.share-calendar.goal':
    'Birinin planınıza söz sahibi olmadan ne zaman izinli olduğunuzu görmesine izin verin.',
  'help.guide.share-calendar.step.1': 'Paylaşılan Takvimler panelindeki paylaş simgesine tıklayın.',
  'help.guide.share-calendar.step.2': "Kullanıcıyı seçin ve Paylaş'a tıklayın. Kabul gerekmez.",
  'help.guide.share-calendar.step.3':
    'Sizinle paylaşılan takvimler aynı panelde görünür; göz birini gizler, Paylaşımı durdur sizinkini geri alır.',
  'help.guide.share-calendar.result':
    'İzin günleriniz onun ızgarasında renkli bir halka olarak görünür. Paylaştığınız hiçbir şey oradan düzenlenemez.',
  'help.guide.share-calendar.tip.1':
    'Paylaşma ve birleştirme bağımsızdır: bir kişiyle birleşip başkalarıyla paylaşabilirsiniz.',
  'help.guide.share-calendar.tip.2': 'Halkalı bir günün üzerine gelerek kimin ne kadar süre izinli olduğunu görün.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas, dünya haritasındaki seyahat iziniz: bir gezinin sizi götürdüğü her ülke renklendirilir, TREK’ten önce gittiklerinizi ise elle eklersiniz. Bölgeler için yakınlaştırın, hâlâ görmek istediğiniz yerlerin bir yapılacaklar listesini tutun ve rakamlarınızı alttaki cam panelden okuyun.',
  'help.ctx.atlas.bullet.1':
    'Harita: gidilen ülkeler kendilerine kalan bir renk taşır, planlanan ülkelerin kesikli çerçevesi, yapılacaklar listesindekilerin çapraz taraması vardır, geri kalan her yer gridir. Gezileri, yerleri ve ilk ile son ziyareti görmek için bir ülkenin üzerine gelin.',
  'help.ctx.atlas.bullet.2':
    'Üstteki arama: bir ülke ya da yer yazın. Bir ülkeyi seçmek haritayı oraya uçurur ve açılır penceresini açar; bir yeri seçmek onun bölgesine iner, böylece onu işaretleyebilirsiniz.',
  'help.ctx.atlas.bullet.3':
    'Planlanan ülkeleri göster, sağ üstte: yaklaşan gezilerinizin ülkelerini ortaya çıkarır. Anahtar yalnızca böyle gezileriniz olduğu sürece görünür.',
  'help.ctx.atlas.bullet.4':
    'Alttaki panel: ülkeler, geziler, yerler, şehirler, günler, kıtalar ve serinizle İstatistikler sekmesi; hâlâ önünüzde olanlarla Yapılacaklar Listesi sekmesi.',
  'help.ctx.atlas.bullet.5':
    'Bölgeler: yakınlaştırma seviyesi 5’ten itibaren harita eyaletlere ve illere geçer, her biri işaretlemek ya da kaldırmak için tıklanabilir.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: eklenti bağlıyken istatistiklerin solundaki bir panel dilekleri işaretler ve kayıtlarınızdan ülke ekler, asla sizin onayınız olmadan değil.',
  // mark-country
  'help.guide.mark-country.title': 'Bir ülkeyi ziyaret edildi olarak işaretleyin',
  'help.guide.mark-country.goal': 'TREK’ten önce gittiğiniz bir ülkeyi ekleyin ki harita ve sayacınız onu içersin.',
  'help.guide.mark-country.step.1': 'Ülkeyi haritanın üstündeki arama kutusuna yazın.',
  'help.guide.mark-country.step.2': 'Listeden seçin. Harita oraya uçar ve o ülke için bir pencere açılır.',
  'help.guide.mark-country.step.3': 'Ziyaret edildi olarak işaretle seçeneğini seçin.',
  'help.guide.mark-country.result':
    'Ülke haritada rengini alır ve Ülkeler bir fazla sayar. Bu renk kalıcıdır: başka ülkeleri işaretlemek diğerlerini asla karıştırmaz.',
  'help.guide.mark-country.tip.1':
    'Haritada gri bir ülkeye tıklamak aynı pencereyi açar; küçük ülkeler için arama en güvenli yoldur.',
  'help.guide.mark-country.tip.2':
    'Elle işaretlediğiniz bir ülke, oraya giden gezinin tarihleri ne olursa olsun her zaman gidildi sayılır.',
  // unmark-country
  'help.guide.unmark-country.title': 'İşaretlediğiniz bir ülkeyi kaldırın',
  'help.guide.unmark-country.goal': 'Elle işaretlenmiş bir ülkeyi haritadan yeniden kaldırın.',
  'help.guide.unmark-country.step.1':
    'Ülkeyi arayıp seçin ya da haritada tıklayın. Kendi işaretlediğiniz bir ülke için pencere kaldırılıp kaldırılmayacağını sorar.',
  'help.guide.unmark-country.step.2': 'Kaldırmak ile onaylayın.',
  'help.guide.unmark-country.result': 'Ülke yeniden griye döner ve sayacınızdan çıkar.',
  'help.guide.unmark-country.tip.1':
    'Bu şekilde yalnızca elle işaretlenen ülkeler kaldırılabilir. Gezisi ya da yeri olan bir ülke onlar oldukça kalır; elle işaretlendiyse Kaldırmak paneldeki ayrıntı kartında da bulunur.',
  // country-details
  'help.guide.country-details.title': 'Bir ülkede ne yaptığınızı görün',
  'help.guide.country-details.goal': 'Gidilen bir ülkeyi açın ve sizi oraya götüren gezilere atlayın.',
  'help.guide.country-details.step.1': 'Gittiğiniz bir ülkeyi arayın.',
  'help.guide.country-details.step.2':
    'Seçin. Harita oraya uçar ve alttaki panele bayrağı, yerleri, gezileri ve gezi başına bir çip içeren bir kart eklenir.',
  'help.guide.country-details.result': 'O geziyi planlayıcıda açmak için bir gezi çipine tıklayın.',
  'help.guide.country-details.tip.1':
    'Haritada ülkenin üzerine gelmek aynı rakamları artı ilk ve son ziyareti gösterir.',
  // planned-countries
  'help.guide.planned-countries.title': 'Gideceğiniz ülkeleri gösterin',
  'help.guide.planned-countries.goal': 'Yaklaşan gezilerinizin ülkelerini gidildi saymadan haritaya getirin.',
  'help.guide.planned-countries.step.1':
    'Sağ üstteki Planlanan ülkeleri göster anahtarını açın. Yanındaki sayı kaç tanesinin beklediğini söyler.',
  'help.guide.planned-countries.step.2':
    'Planlanan bir ülkeyi arayıp seçin: panel Planlandı der ve haritadaki ipucu ne zaman gideceğinizi gösterir.',
  'help.guide.planned-countries.result':
    'Planlanan ülkeler kesikli çerçeveyle görünür, böylece asla zaten gittiğiniz bir yer gibi durmazlar. Anahtar seçiminizi hatırlar.',
  'help.guide.planned-countries.tip.1':
    'Bir ülke, oraya olan gezi başladığında gidildi sayılır; süren bir gezi de sayılır. Tarihsiz geziler istatistiklerin tamamen dışında kalır.',
  'help.guide.planned-countries.tip.2': 'Anahtar yalnızca yaklaşan gezileriniz olduğu sürece vardır.',
  // regions
  'help.guide.regions.title': 'Bir bölgeyi işaretleyin',
  'help.guide.regions.goal': 'Ülkelerden daha ince: gittiğiniz eyaletleri, illeri ya da vilayetleri işaretleyin.',
  'help.guide.regions.step.1':
    'Bölgeleri görünene kadar bir ülkeye yakınlaştırın, yakınlaştırma seviyesi 5’ten itibaren. Ülkeyi arayıp seçmek sizi yeterince yaklaştırır.',
  'help.guide.regions.step.2':
    'Bir bölgeye tıklayın. Üzerine gelmek adını söyler; pencere bölgeyi ve ülkesini gösterir.',
  'help.guide.regions.step.3': 'Ziyaret edildi olarak işaretle seçeneğini seçin.',
  'help.guide.regions.result':
    'Bölge ülkenin rengiyle dolar. Bir bölgeyi işaretlemek, henüz değilse ülkeyi de gidildi sayar.',
  'help.guide.regions.tip.1':
    'Gidilen bir bölgeye tıklamak Kaldırmak seçeneğini sunar; ister siz işaretlemiş olun, ister bir yer onu oraya koymuş olsun.',
  'help.guide.regions.tip.2': 'Gerçek yerlerinizin olduğu bölgeler sizin için işaretlenir; orada yapacak bir şey yok.',
  // search-place
  'help.guide.search-place.title': 'Bir yer bulun ve bölgesini işaretleyin',
  'help.guide.search-place.goal':
    'Bir şehrin hangi bölgede olduğunu bilmeden, Münih’i arayarak Bavyera’yı işaretleyin.',
  'help.guide.search-place.step.1':
    'Arama kutusuna bir şehir, bir simge yapı ya da bir adres yazın. Önce ülkeler gelir; eşleşen yerler altlarında Yerler başlığı altında görünür.',
  'help.guide.search-place.step.2': 'Yeri seçin. Harita oraya uçar ve noktanın hangi bölgede olduğunu bulur.',
  'help.guide.search-place.step.3':
    'O bölge için Ziyaret edildi olarak işaretle ya da hâlâ önünüzdeyse Yapılacaklar listesine ekle seçeneğini seçin.',
  'help.guide.search-place.result':
    'Bölge işaretlenir ve onunla birlikte ülke de. Harita paketinde bölge verisi olmayan ülkeler ülkenin kendisine döner.',
  'help.guide.search-place.tip.1':
    'Yerler TREK’in her yerindeki aynı aramadan gelir, dolayısıyla yöneticinizin kurduğu sağlayıcıyı izler.',
  // bucket-country
  'help.guide.bucket-country.title': 'Bir ülkeyi yapılacaklar listesine koyun',
  'help.guide.bucket-country.goal':
    'Gittiklerinizden ayrı olarak, doğrudan haritada bir ülke yapılacaklar listesi tutun.',
  'help.guide.bucket-country.step.1': 'Ülkeyi arayıp seçin ya da haritada tıklayın.',
  'help.guide.bucket-country.step.2': 'Yapılacaklar listesine ekle seçeneğini seçin.',
  'help.guide.bucket-country.step.3':
    'Ne zaman olduğunu biliyorsanız ay ve yıl seçin, sonra Yapılacaklar listesine ekle ile onaylayın.',
  'help.guide.bucket-country.result':
    'Ülke, oraya vardığınızda taşıyacağı renkte çapraz taramayla çizilir ve panelin Yapılacaklar Listesi sekmesinde görünür.',
  'help.guide.bucket-country.tip.1':
    'Ülke listeye girdiğinde aynı pencere Yapılacaklar listesinden kaldır seçeneğini sunar.',
  'help.guide.bucket-country.tip.2':
    'Hedef tarih başına bir kayıt: aynı ülke iki farklı ay için listede olabilir ama aynı ay için iki kez olamaz.',
  // bucket-place
  'help.guide.bucket-place.title': 'Yapılacaklar listesine bir yer ekleyin',
  'help.guide.bucket-place.goal':
    'Hayalini kurduğunuz bir şehri, bir yeri ya da bir adresi koordinatları ve hedef tarihiyle kaydedin.',
  'help.guide.bucket-place.step.1': 'Alttaki panelde Yapılacaklar Listesi sekmesini açın.',
  'help.guide.bucket-place.step.2': 'Yer ekle düğmesine tıklayın.',
  'help.guide.bucket-place.step.3':
    'Adı yazın ve arama düğmesine basın; yerin koordinatları olsun diye eşleşmeyi seçin. Yalnızca bir ad yazıp aramayı atlamak da işe yarar.',
  'help.guide.bucket-place.step.4': 'İsterseniz ay ve yıl seçin ve Ekle düğmesine tıklayın.',
  'help.guide.bucket-place.result':
    'Yer, hedef tarihiyle yapılacaklar listenizin en üstünde durur; yanındaki × onu yeniden kaldırır.',
  'help.guide.bucket-place.tip.1':
    'Koordinatlı bir dilek, kayıtlarınız orada olduğunuzu gösterdiğinde Dawarich’in sizin için sonradan işaretleyebileceği şeydir.',
  // stats
  'help.guide.stats.title': 'İstatistiklerinizi okuyun',
  'help.guide.stats.goal': 'Paneldeki rakamların neyi saydığını ve neyi saymadığını bilin.',
  'help.guide.stats.step.1':
    'Ülkeler, gerçekten gittiğiniz farklı ülkelerin sayısıdır; planlananlar yanında gösterilir, içinde değil. Geziler, Yer ve Günler tüm gezilerinizin toplamlarıdır. Şehirler yerlerinizin adreslerinden çıkarılır, yani bir tahmindir.',
  'help.guide.stats.step.2':
    'Kıtalar kıta başına gidilen ülkeleri gösterir; Antarktika, oraya gittiğinizde sıraya katılır. Sonra seriniz, en az bir geziyle ardışık yıllar, ve bu yıl kaç gezi yaptığınız.',
  'help.guide.stats.result': 'Rakamlar gezilerinizi planladıkça onları izler; burada bakım gerektiren bir şey yok.',
  'help.guide.stats.tip.1':
    'Şehirler adres metninden okunur, aranmaz; bu yüzden “Osteria Francescana, Italy” gibi kısa bir adres ya da bir vilayetle biten bir adres şehir yerine bölge verebilir.',
  'help.guide.stats.tip.2':
    'Elle işaretlenen ülkeler Ülkeler’de ve kıtalarda sayılır ama gezi, yer ya da gün getirmez.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Kayıtlarınızdan ülke ekleyin',
  'help.guide.dawarich-countries.goal':
    'Son bir yılda hangi ülkelerde bulunduğunuzu Dawarich söylesin ve onayladıklarınız haritaya konsun.',
  'help.guide.dawarich-countries.step.1':
    'Dawarich eklentisi bağlıyken haritanın altında, istatistiklerin solunda iki kutucuklu bir Dawarich paneli durur. Ülkeler kutucuğuna tıklayın.',
  'help.guide.dawarich-countries.step.2':
    'Pencere Ülkeler sekmesinde açılır. Ülkeleri ara düğmesine tıklayın: TREK, kayıtlarınızın son 12 ayda kapsadığı ülkeleri ve şehirleri ay ay okur, bu yüzden biraz zaman tanıyın. Atlas’ınızda henüz olmayan her ülke bayrağıyla, kaç şehir olduğuyla ve bunların ilkinin adıyla listelenir ve işaretli başlar; dışarıda bırakmak için satıra tıklayın.',
  'help.guide.dawarich-countries.step.3':
    'Sağ alttaki düğmeyle onaylayın; beş satır işaretliyken düğmede 5 ülke ekle yazar. Pencere kaç tanesinin eklendiğini söyler; kapatın, harita kendini yeniden okumuştur.',
  'help.guide.dawarich-countries.result':
    'Onaylanan ülkeler haritada bir renk taşır ve Ülkeler içinde sayılır, Dawarich’ten geldiği kayıtlıdır. Elle işaretledikleriniz dokunulmamış kalır.',
  'help.guide.dawarich-countries.tip.1':
    'Atlas’ın zaten gidilmiş gösterdiği ülkeler, ister elle, ister bir geziden, ister önceki bir denetimden olsun, dışarıda bırakılır, böylece kendi işaretleriniz asla yeniden etiketlenmez. Daha önce Atlas’tan kaldırdığınız bir ülke, burada onayladığınızda geri gelir.',
  'help.guide.dawarich-countries.tip.2':
    'TREK’in eşleştiremediği bir ülke adı atılmak yerine satırların altında listelenir ve Yeniden kontrol et Dawarich’e bir kez daha sorar. Listenin altındaki not son 12 ayın incelendiğini söyler; o pencere sabittir.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Kayıtlarınızdan dilekleri işaretleyin',
  'help.guide.dawarich-wishes.goal':
    'Yapılacaklar listenizdeki hangi yerlere gerçekten ulaştığınızı öğrenin ve onları olduğu gün için işaretleyin.',
  'help.guide.dawarich-wishes.step.1':
    'Haritanın altında, istatistiklerin solundaki Dawarich panelinde Dilek listesi kutucuğuna tıklayın.',
  'help.guide.dawarich-wishes.step.2':
    'Pencere Dilek listesi sekmesinde açılır. Dilek listesini denetle düğmesine tıklayın: TREK, koordinatı olan her kayıt için kayıtlarınızı tarar. Ulaştığınız bir dilek ne kadar yaklaştığınızla, ne kadar kaldığınızla ve günüyle listelenir ve işaretli başlar; zaten işaretlediğiniz birinde Zaten işaretlenmiş yazar. Listenin altında bir not koordinatsız kayıtları sayar ve kural da orada durur: Bir dilek 250 m yakınlıkta ve yerinde 20 dakika sonra ulaşılmış sayılır.',
  'help.guide.dawarich-wishes.step.3':
    'Sağ alttaki düğmeyle onaylayın; iki satır işaretliyken düğmede 2 tanesini işaretle yazar. Sonra pencereyi kapatın ve yanındaki panelin Yapılacaklar Listesi sekmesini açın.',
  'help.guide.dawarich-wishes.result':
    'Her dilek, bugünün değil kalışın tarihiyle yeşil bir onay işareti taşır; ipucu Dawarich kayıtlarınızdan işaretlendi der ve tarihe bir tıklama bunu geri alır.',
  'help.guide.dawarich-wishes.tip.1':
    'Yanından geçmek sayılmaz: kural hem yakınlık hem süre ister ve uyan birkaç kalıştan en uzunu kazanır. Koordinatsız bir dilek denetlenemez, bu yüzden yerleri yalnızca adla değil, Yer ekle içindeki aramayla ekleyin.',
  'help.guide.dawarich-wishes.tip.2':
    'Bir denetim en fazla 50 kayda bakar, önce henüz işaretlenmemiş olanlara, ve daha fazlası olduğunda bunu söyler. Zaten işaretlenmiş bir dilek kendi tarihini korur.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Koleksiyonlar',
  'help.ctx.collections.summary':
    'Collections, herhangi bir gezinin dışındaki yer kitaplığınızdır: bulduğunuz ve saklamak istediğiniz yerlerin adlandırılmış listeleri, her yerin Fikir, Gitmek istiyorum ya da Gidildi durumu vardır. Yerler gezilere ve gezilerden kopyalanır, asla bağlanmaz; bu yüzden bir liste ile bir gezi birbirini asla değiştirmez.',
  'help.ctx.collections.bullet.1':
    'Soldaki liste çubuğu: kendi listeleriniz, sizinle paylaşılanlar, onay bekleyen davetler, sahip olduğunuz her şeyin birleşimi olarak Tüm kayıtlılar ve en üstte Yeni liste ile dosya içe aktarma.',
  'help.ctx.collections.bullet.2':
    'Açık listenin başlık alanı: rengi, kapağı, açıklaması ve bağlantıları, üyeler ve sağda Düzenle, Dışa aktar ve Paylaş eylemleri.',
  'help.ctx.collections.bullet.3':
    'Yerlerin üstündeki filtre satırı: durum, kategori, puan ve sıralama, etiket filtresi, yer eklemek için +, geziden içe aktarma ve toplu eylemler için Seç.',
  'help.ctx.collections.bullet.4':
    'Yer satırları: avatar, ad ve adres, etiketler ve kategori, sağda ise tek tıkla değişen durum rozeti.',
  'help.ctx.collections.bullet.5':
    'Sağdaki harita: koordinatı olan her yer için bir iğne, liste ya da harita geçişi, arama kutusu ve etiket filtresi. Bir iğneye tıklamak o yeri açar.',
  'help.ctx.collections.bullet.6':
    'Ayrıntı paneli: kapak, kategori, etiketler, durum, açıklama ve bağlantılar için bir satıra tıklayın; Düzenle, Geziye kopyala ve Listeden kaldır da oradadır.',
  // create-list
  'help.guide.create-list.title': 'Bir liste oluşturun',
  'help.guide.create-list.goal': 'Rengi ve kapağı olan, yerlere hazır, adlandırılmış yeni bir liste başlatın.',
  'help.guide.create-list.step.1': 'Liste çubuğunun en üstündeki Yeni liste seçeneğine tıklayın.',
  'help.guide.create-list.step.2':
    'Listeye bir ad verin ve bir renk seçin. Kapak resmi, açıklama ve bağlantılar isteğe bağlıdır; bunları daha sonra Düzenle ile ekleyebilirsiniz.',
  'help.guide.create-list.step.3': 'Oluştur seçeneğine tıklayın.',
  'help.guide.create-list.result':
    'Liste boş açılır; doldurmanın iki yolu olarak Yer ekle ve Bir geziden içe aktar sunulur.',
  'help.guide.create-list.tip.1':
    'Kapak, kendi yüklediğiniz bir görsel ya da aynı iletişim kutusundaki Unsplash aramasıyla bulunan bir fotoğraf olabilir.',
  // add-place
  'help.guide.add-place.title': 'Bir yer ekleyin',
  'help.guide.add-place.goal':
    'Bir yer bulun ve onu ad, kategori, durum ve notlarla tek seferde açık listeye kaydedin.',
  'help.guide.add-place.step.1': 'Yerlerin üstündeki filtre satırında + simgesine tıklayın.',
  'help.guide.add-place.step.2': 'Yeri arama alanına yazın ve bir sonuç seçin. Ad, adres ve koordinatlar ondan dolar.',
  'help.guide.add-place.step.3':
    'Durumu ve isterseniz bir kategori, bir açıklama ve bağlantıları ayarlayın, sonra Ekle seçeneğine tıklayın. İletişim kutusu sonraki yer için açık kalır; İptal kapatır.',
  'help.guide.add-place.result': 'Yer listede görünür ve koordinatı varsa haritada bir iğne olarak da görünür.',
  'help.guide.add-place.tip.1':
    'Bir gezinin içinden, yer denetçisindeki ya da yer menüsündeki Koleksiyona kaydet, geziden ayrılmadan bir gezi yerini bir listeye koyar.',
  'help.guide.add-place.tip.2':
    'Liste sizin olmalı ya da editör veya yönetici olduğunuz bir liste olmalıdır; + işareti Tüm kayıtlılar üzerinde ya da yalnızca görüntülediğiniz bir listede yoktur.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Bir geziden yerleri içe aktarın',
  'help.guide.import-from-trip.goal':
    'Bütün bir gezinin yerlerini tek tek kaydetmek yerine hepsini bir kerede listeye getirin.',
  'help.guide.import-from-trip.step.1':
    'Filtre satırındaki bulut oklu içe aktarma düğmesine tıklayın. Boş bir listede aynı eylem Yer ekle seçeneğinin yanındadır.',
  'help.guide.import-from-trip.step.2': 'Gezilerinizden birini seçin.',
  'help.guide.import-from-trip.step.3':
    'İstediğiniz yerleri işaretleyin. Listede zaten bulunan yerler soluk görünür; gezinin hiçbir gününde yer almayanlar baştan seçili gelir. Yalnızca yeniler, zaten sahip olduklarınızı gizler.',
  'help.guide.import-from-trip.step.4':
    'İçe aktar seçeneğine tıklayın. Düğme her zaman kaç yerin eklenmek üzere olduğunu söyler.',
  'help.guide.import-from-trip.result':
    'Yerler adı, adresi, koordinatları, açıklaması ve kategorisiyle listeye kopyalanır. Gezi olduğu gibi kalır.',
  'help.guide.import-from-trip.tip.1':
    'Ada ya da koordinata göre yinelenenler otomatik atlanır, bu yüzden iki kez içe aktarmak zarar vermez.',
  'help.guide.import-from-trip.tip.2':
    'Bir gezinin yer listesinde ise seçim modu, elle seçilmiş bir yer kümesi için bunun yerine Koleksiyona kaydet sunar.',
  // place-status
  'help.guide.place-status.title': 'Bir yerin durumunu ayarlayın',
  'help.guide.place-status.goal': 'Neyin fikir, neyin kısa listede olduğunu ve nereye gittiğinizi takip edin.',
  'help.guide.place-status.step.1':
    'Bir yer satırının sağ ucundaki durum rozetine tıklayın. Fikir, Gitmek istiyorum olur.',
  'help.guide.place-status.step.2':
    'Gidildi için yeniden tıklayın, Fikir ile baştan başlamak için bir kez daha tıklayın.',
  'help.guide.place-status.result':
    'Rozet ve rengi hemen değişir; listenin üstündeki durum filtresi de buna göre sayar.',
  'help.guide.place-status.tip.1':
    'Durum bir Collections özelliğidir: bir yeri geziye kopyalamak onu beraberinde taşımaz.',
  'help.guide.place-status.tip.2':
    'Bir geziden Listeye kaydet, yerin bulunduğu her liste için bir durum rozeti gösterir ve yerler panelinde bir seçim için Ziyaret edildi işaretle eylemi vardır.',
  // place-detail
  'help.guide.place-detail.title': 'Kaydedilmiş bir yeri açın',
  'help.guide.place-detail.goal':
    'Bir yer hakkındaki her şeyi görün ve harekete geçin: düzenleyin, bir geziye kopyalayın, kaldırın.',
  'help.guide.place-detail.step.1':
    'Bir yer satırına tıklayın. Ayrıntı paneli listenin yanında açılır ve harita yere kayar.',
  'help.guide.place-detail.step.2':
    'Altta Düzenle, Geziye kopyala ve Listeden kaldır bulunur; kapaktaki kamera otomatik fotoğrafı kendi fotoğrafınızla değiştirir.',
  'help.guide.place-detail.result':
    'Düzenle, doğrudan panelde ad, kategori, etiketler, adres, koordinatlar, açıklama ve bağlantıların kilidini açar.',
  'help.guide.place-detail.tip.1':
    'Yerin kendi resmi yoksa kapak otomatik getirilir. Kendi yüklemeniz 20 MB’a kadar JPG, PNG, GIF ya da WebP olabilir.',
  'help.guide.place-detail.tip.2':
    'Paylaşılan bir listenin üyeleri burada yıldızlı puan da bırakabilir ve filtre satırındaki puan filtresi ortalamayı kullanır.',
  // labels
  'help.guide.labels.title': 'Yerleri etiketlerle gruplayın',
  'help.guide.labels.goal':
    'Ortak kategorilerin ötesinde, bir listeye semtler ya da günler gibi kendi etiketlerini verin.',
  'help.guide.labels.step.1': 'Filtre satırındaki etiket denetiminden etiket yöneticisini açın.',
  'help.guide.labels.step.2':
    'Bir ad yazın, bir renk seçin ve Etiket ekle seçeneğine tıklayın. Mevcut etiketleri aynı iletişim kutusunda yeniden adlandırın, yeniden renklendirin ya da silin.',
  'help.guide.labels.step.3':
    'Seç seçeneğini açın, yerleri işaretleyin ve seçim çubuğundaki Etiket ata seçeneğine tıklayın. Tek bir yer, ayrıntı panelindeki Düzenle üzerinden de etiket alır.',
  'help.guide.labels.step.4':
    'Listeyi ve haritayı bunlardan herhangi birini taşıyan yerlere daraltmak için filtre satırında bir ya da daha fazla etiket seçin.',
  'help.guide.labels.result':
    'Etiketli yerler etiketlerini satırda gösterir; etiket filtresi görüntüleyiciler dahil her üye için oradadır.',
  'help.guide.labels.tip.1':
    'Etiketler, oluşturuldukları tek listeye aittir. Bir yeri başka bir listeye taşımak onları düşürür.',
  'help.guide.labels.tip.2': 'Etiketleri yönetmek ve atamak, listede düzenleme hakkı gerektirir.',
  // filter-select
  'help.guide.filter-select.title': 'Yerleri filtreleyin ve seçin',
  'help.guide.filter-select.goal': 'Listeyi daraltın ve birçok yer üzerinde tek seferde işlem yapın.',
  'help.guide.filter-select.step.1':
    'Filtre satırındaki açılır menüleri kullanın: durum, kategori, en düşük puan ve sıralama düzeni. Her biri kaç yer bırakacağını gösterir.',
  'help.guide.filter-select.step.2':
    'Seç seçeneğine tıklayın. Her satır bir onay kutusu alır ve bir seçim çubuğu belirir.',
  'help.guide.filter-select.step.3':
    'Yerleri işaretleyin ya da o an filtrelenmiş her şey için Tümünü seç kullanın, sonra Etiket ata, Listeye taşı, Listeye çoğalt, Geziye kopyala ya da Sil seçeneklerinden birini seçin.',
  'help.guide.filter-select.result': 'Eylemler tüm seçime bir kerede uygulanır. Sağdaki × seçim modundan çıkar.',
  'help.guide.filter-select.tip.1':
    'Tümünü seç filtreyi izler; bu yüzden Gitmek istiyorum ile filtreleyip tümünü seçmek, kısa liste üzerinde işlem yapmanın hızlı yoludur.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Yerleri bir geziye kopyalayın',
  'help.guide.copy-to-trip.goal': 'Kaydedilmiş yerleri gezilerinizden birinde duraklara dönüştürün.',
  'help.guide.copy-to-trip.step.1':
    'Seç seçeneğini açıp yerleri işaretleyin ya da bir yeri açıp ayrıntı panelindeki Geziye kopyala seçeneğini kullanın.',
  'help.guide.copy-to-trip.step.2': 'Seçim çubuğundaki Geziye kopyala seçeneğine tıklayın.',
  'help.guide.copy-to-trip.step.3': 'Geziyi seçin. Arama kutusu uzun bir listeyi daraltır.',
  'help.guide.copy-to-trip.result':
    'Yerler o gezinin yer listesine ad, açıklama, kategori, notlar, fiyat, koordinatlar, fotoğraf ve etiketlerle iner. Koleksiyonda hiçbir şey değişmez.',
  'help.guide.copy-to-trip.tip.1':
    'Paylaşılan bir listenin görüntüleyicileri de bunu yapabilir; listeden dışarı kopyalar, listeyi değiştirmez.',
  // share-list
  'help.guide.share-list.title': 'Bir listeyi biriyle paylaşın',
  'help.guide.share-list.goal': 'Bir listeyi bu TREK’teki başka kişilerle birlikte, canlı olarak planlayın.',
  'help.guide.share-list.step.1': 'Listenizin başlık alanındaki Paylaş seçeneğine tıklayın.',
  'help.guide.share-list.step.2': 'Kullanıcıyı ve bir rol seçin: Görüntüleyici, Editör ya da Yönetici.',
  'help.guide.share-list.step.3':
    'Davet gönder seçeneğine tıklayın. Kişi, daveti liste çubuğunda kabul edene kadar bekleyen davet olarak görünür.',
  'help.guide.share-list.result':
    'Kabul edildiğinde liste onlar için Paylaşılan altında görünür ve her değişiklik canlı eşitlenir. Üyeler ve rolleri aynı iletişim kutusunda düzenlenebilir kalır.',
  'help.guide.share-list.tip.1':
    'Görüntüleyiciler bakabilir, puan verebilir ve yerleri kendi gezilerine kopyalayabilir. Editörler yer ve etiket ekler ve düzenler. Yöneticiler ayrıca silebilir.',
  'help.guide.share-list.tip.2':
    'Yalnızca sahip kişi davet eder ve çıkarır; bir üye paylaşılan listeden kendisi ayrılabilir.',
  // export-list
  'help.guide.export-list.title': 'Bir listeyi dosya olarak dışa aktarın',
  'help.guide.export-list.goal': 'Bir listeyi başka bir TREK’teki birine verin ya da bir harita uygulamasına götürün.',
  'help.guide.export-list.step.1': 'Listenin başlık alanındaki Dışa aktar seçeneğine tıklayın.',
  'help.guide.export-list.step.2':
    'Başka bir TREK için etiketler ve durumla TREK listesi seçin ya da OsmAnd, Organic Maps, bir Garmin ve yol noktası okuyan diğer uygulamalar için GPX seçin.',
  'help.guide.export-list.result': 'Dosya indirilir. Paylaşılan bir listenin her üyesi onu dışa aktarabilir.',
  'help.guide.export-list.tip.1':
    'Koordinatı olmayan bir yer GPX yol noktası olamaz; dışarıda bırakılır ve TREK kaç tane olduğunu söyler.',
  'help.guide.export-list.tip.2':
    'Puanlar, üyeler ve yüklenen fotoğraflar bilerek geride kalır; bunlar listeye değil, bu TREK’e aittir.',
  // import-file
  'help.guide.import-file.title': 'Dosyadan bir liste içe aktarın',
  'help.guide.import-file.goal':
    'Bir TREK liste dosyasını ya da bir GPX dosyasını yeni bir liste olarak ya da sahip olduğunuz bir listeye getirin.',
  'help.guide.import-file.step.1':
    'Liste çubuğunda Yeni liste seçeneğinin yanındaki yükleme oklu içe aktarma düğmesine tıklayın.',
  'help.guide.import-file.step.2':
    'Dosyayı seçin. TREK, herhangi bir şey olmadan önce içinde ne olduğunu gösterir: adı, kaç yer ve etiket olduğu.',
  'help.guide.import-file.step.3':
    'Yeni liste seçeneğini koruyup isterseniz adı değiştirin ya da yerleri düzenleyebildiğiniz bir listeye koymak için Bir listeye ekle seçin, sonra İçe aktar seçeneğine tıklayın.',
  'help.guide.import-file.result':
    'İçe aktarılan yerlerle listeye inersiniz. Bir listeye eklemek yalnızca ekler; zaten orada olan yerler durumunu, notlarını ve etiketlerini korur.',
  'help.guide.import-file.tip.1':
    'Bir GPX’ten adlandırılmış her yol noktası bir yer olur; izler çizgidir ve dışarıda bırakılır, önizleme bunun kaç nokta olduğunu söyler.',
  'help.guide.import-file.tip.2':
    'Ne TREK listesi ne de GPX olan bir dosya bir gerekçeyle reddedilir; okunamayan tek bir yer atlanır, dosyanın tamamı değil.',
  // edit-list
  'help.guide.edit-list.title': 'Bir listeyi düzenleyin ya da silin',
  'help.guide.edit-list.goal':
    'Bir listenin adını, rengini, kapağını, açıklamasını ya da bağlantılarını değiştirin ya da listeyi kaldırın.',
  'help.guide.edit-list.step.1': 'Listenin başlık alanındaki Düzenle seçeneğine tıklayın. Onu yalnızca sahip görür.',
  'help.guide.edit-list.step.2':
    'İstediğinizi değiştirin ve Kaydet seçeneğine tıklayın. Sol alttaki Listeyi sil, bir onaydan sonra listeyi tüm yerleriyle birlikte kaldırır.',
  'help.guide.edit-list.result': 'Başlık alanı yeni rengi, kapağı ve açıklamayı hemen alır.',
  'help.guide.edit-list.tip.1': 'Bir listeyi silmek geri alınamaz. Bir kopya saklamak istiyorsanız önce dışa aktarın.',
  // all-saved
  'help.guide.all-saved.title': 'Tüm kitaplığınızda arayın',
  'help.guide.all-saved.goal': 'Sahip olduğunuz her listeye tek seferde bakın.',
  'help.guide.all-saved.step.1':
    'Liste çubuğundaki Tüm kayıtlılar seçeneğine tıklayın. Sahip ya da ortak sahip olduğunuz her listenin yerlerini birleştirir.',
  'help.guide.all-saved.step.2':
    'Arama kutusunu ve filtreleri herhangi bir listedeki gibi kullanın; Seç burada da bir geziye kopyalamak için çalışır.',
  'help.guide.all-saved.result':
    'Ekleme ya da içe aktarma olmadan tüm kayıtlı yerlerinize tek bir bakış; çünkü onları koyacak tek bir listesi yoktur.',
  'help.guide.all-saved.tip.1':
    'Etiketler liste başınadır, bu yüzden etiket filtresi Tüm kayıtlılar üzerinde sunulmaz.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Seyahat',
  'help.ctx.journey.summary':
    'Journey, fotoğrafı öne alan seyahat günlüğünüzdür. Her Journey bir ya da daha fazla geziye bağlıdır ve hikâye, fotoğraf, ruh hali ve hava durumu içeren kayıtlarla gün gün büyür. Bu ekran Journey’lerinizi listeler; yazmak için birini açın.',
  'help.ctx.journey.bullet.1':
    'Üstteki afiş süren Journey’i ya da en son Journey’inizi kayıt, fotoğraf ve yer sayılarıyla gösterir. Yazmaya devam et onu bugünde açar.',
  'help.ctx.journey.bullet.2':
    'Altta her Journey için kapağı, alt başlığı, tarihleri ve sayılarıyla bir kart. Açmak için bir karta tıklayın.',
  'help.ctx.journey.bullet.3': 'Izgaradaki son kart, Yeni Journey oluştur, gezilerinizden bir tane başlatır.',
  // create-journey
  'help.guide.create-journey.title': 'Bir Journey oluşturun',
  'help.guide.create-journey.goal': 'Bir gezi için günlük başlatın; gezinin yerleri öneri olarak zaten bekler.',
  'help.guide.create-journey.step.1': 'Izgaradaki son kart olan Yeni Journey oluştur seçeneğine tıklayın.',
  'help.guide.create-journey.step.2':
    'Bir ad ve isterseniz bir alt başlık verin, ardından ait olduğu gezileri işaretleyin. Sayaç kaç yerin geleceğini söyler.',
  'help.guide.create-journey.step.3': 'Journey Oluştur seçeneğine tıklayın.',
  'help.guide.create-journey.result':
    'Günlük açılır. Bağlı gezilerin her yeri, üzerinde durduğu her gün için bir tane olmak üzere, zaman çizelgesinde yazılmaya hazır bir öneri olarak durur.',
  'help.guide.create-journey.tip.1': 'Daha fazla gezi daha sonra Journey Ayarları içinden bağlanabilir.',
  'help.guide.create-journey.tip.2': 'Gezisiz bir Journey de çalışır; kayıtları o zaman elle eklersiniz.',
  // open-journey
  'help.guide.open-journey.title': 'Bir Journey açın',
  'help.guide.open-journey.goal': 'Bir günlüğe girin ve nerede açılacağını bilin.',
  'help.guide.open-journey.step.1':
    'Bir karta tıklayın. Her kart kapağı, tarihleri ve Journey’in kaç kayıt, fotoğraf ve yer barındırdığını gösterir.',
  'help.guide.open-journey.result':
    'Süren bir Journey bugünde açılır ya da henüz hiçbir şey yazılmamışsa bugünden önceki son kayıtta; bitmiş olan başta açılır.',
  'help.guide.open-journey.tip.1':
    'Journey Ayarları içinde bir kapak seçmediyseniz kapak, Journey’in ilk fotoğrafıdır.',
  // continue-writing
  'help.guide.continue-writing.title': 'Süren Journey’e devam edin',
  'help.guide.continue-writing.goal': 'İçinde olduğunuz Journey’in bugünkü sayfasına doğrudan atlayın.',
  'help.guide.continue-writing.step.1':
    'Üstteki afişte Yazmaya devam et seçeneğine tıklayın. Afiş süren Journey’i, süren yoksa en sonuncusunu gösterir.',
  'help.guide.continue-writing.result':
    'Günlük bugünde açılır ya da henüz hiçbir şey yazılmamışsa bugünden önceki son kayıtta.',
  'help.guide.continue-writing.tip.1':
    'Afiş henüz Journey’i olmayan bir gezi için de öneri sunar; Kapat o öneriyi gizler.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Günlük',
  'help.ctx.journey-detail.summary':
    'Açık bir Journey: solda gün gün zaman çizelgesi, sağda her kayıt ve bağlı gezilerin yerleriyle harita. Günlüğe bir şey ekleyen her şey üsttedir; başlık sayıları, Studio’yu, öneri anahtarını ve Journey Ayarları’nı taşır.',
  'help.ctx.journey-detail.bullet.1':
    'Başlık: kapak, ad ve alt başlık, gün, yer, kayıt ve fotoğraf sayıları ve sağda Studio, öneri anahtarı ve Journey Ayarları.',
  'help.ctx.journey-detail.bullet.2':
    'Araç çubuğu: Zaman çizelgesi ve Galeri sekmeleri, Bu yolculukta ara ve Kayıt Ekle.',
  'help.ctx.journey-detail.bullet.3':
    'Zaman çizelgesi: her gün için o güne kayıt eklemek üzere bir + ile bir bölüm; fotoğraf, ruh hali, hava durumu ve hikâyeli kayıt kartları; gezilerden gelen öneriler daha açık bir stilde ve Bu öneriyi yok say ile.',
  'help.ctx.journey-detail.bullet.4':
    'Harita: kesikli bir çizgiyle tarih sırasında bağlanmış iğneler olarak kayıtlar, gezilerin yerleri ve o gezilere aktarılmış GPX izleri.',
  'help.ctx.journey-detail.bullet.5':
    'Journey Ayarları: kapak, ad ve alt başlık, haritadaki izler, kayıt alanları, yok sayılan öneriler, bağlı geziler, katkıda bulunanlar, herkese açık paylaşım, arşivleme ve silme.',
  'help.ctx.journey-detail.bullet.6':
    'Uzun bir zaman çizelgesinin üzerinde iki yuvarlak düğme yüzer: en üste dön ve son kayda atla.',
  // add-entry
  'help.guide.add-entry.title': 'Bir kayıt yazın',
  'help.guide.add-entry.goal': 'Bir günün hikâyesini başlık, metin, ruh hali ve hava durumuyla ekleyin.',
  'help.guide.add-entry.step.1':
    'Araç çubuğunda Kayıt Ekle seçeneğine ya da o günde başlamak için gün başlığındaki + işaretine tıklayın.',
  'help.guide.add-entry.step.2':
    'O ana bir ad verin ve hikâyeyi yazın. Metnin üstündeki araç çubuğu Markdown ile kalın, italik, başlık, alıntı, bağlantı ve liste ekler.',
  'help.guide.add-entry.step.3':
    'Bir ruh hali ve hava durumu seçin, tarihi kontrol edin ve isterseniz bir konum sabitleyin: bir yer arayın ya da mevcut konumunuzu kullanın.',
  'help.guide.add-entry.step.4': 'Kaydet seçeneğine tıklayın.',
  'help.guide.add-entry.result':
    'Kayıt zaman çizelgesinde kendi gününde ve haritada bir iğne olarak görünür. Sayıları başlıkta güncellenir.',
  'help.guide.add-entry.tip.1': 'Bir öneriye yazmak aynı düzenleyicidir, yer zaten ayarlıdır.',
  'help.guide.add-entry.tip.2':
    'Alttaki etiketler serbest metindir, gizli hazine ya da en iyi yemek gibi, ve arama onları bulur.',
  // entry-photos
  'help.guide.entry-photos.title': 'Bir kayda fotoğraf ve video ekleyin',
  'help.guide.entry-photos.goal': 'Bir güne resimler koyun; ilki kaydın kapağı olur.',
  'help.guide.entry-photos.step.1': 'Kartındaki ⋯ ile bir kaydın menüsünü açın ve Düzenle seçeneğini seçin.',
  'help.guide.entry-photos.step.2':
    'Fotoğraf yükle seçeneğine tıklayın ve dosyaları seçin. Galeriden, Journey’in galerisinde zaten bulunan resimleri alır; External photos o gün için bağlı bir Immich ya da Synology kitaplığında arar.',
  'help.guide.entry-photos.step.3':
    'Kapağı seçmek için bir resmin üzerine gelip 1. yap seçeneğini kullanın, ardından Kaydet seçeneğine tıklayın.',
  'help.guide.entry-photos.result': 'Fotoğraflar kartta ve galeride görünür; ilki her yerde küçük resimdir.',
  'help.guide.entry-photos.tip.1':
    'Videolar bir kayda aynı şekilde eklenir: 500 MB’a kadar mp4, m4v, webm ya da mov, yüklendiği gibi saklanır.',
  'help.guide.entry-photos.tip.2':
    'iPhone’dan gelen HEIC dosyaları yüklenirken JPEG’e dönüştürülür, bu da GPS ve kamera meta verilerini düşürür.',
  // suggestions
  'help.guide.suggestions.title': 'Önerileri kullanın ya da yok sayın',
  'help.guide.suggestions.goal':
    'Gezilerinizin yerlerini kayıtlara dönüştürün ve hakkında yazmayacaklarınızı kaldırın.',
  'help.guide.suggestions.step.1':
    'Öneri, yer adı italik olan daha açık renkli bir karttır. Yer ve gün zaten ayarlı olarak düzenleyiciyi açmak için ona tıklayın.',
  'help.guide.suggestions.step.2':
    'Kullanmayacağınız bir kartta Bu öneriyi yok say seçeneğine tıklayın. Silinmeden zaman çizelgesinden ayrılır ve gezi eşitlemesi onu bir daha sunmaz.',
  'help.guide.suggestions.step.3':
    'Fikir mi değiştirdiniz? Journey Ayarları kaç tanesinin yok sayıldığını gösterir ve Yok sayılan önerileri geri getir hepsini geri getirir.',
  'help.guide.suggestions.result':
    'Zaman çizelgesi yalnızca yazmayı düşündüklerinizi tutar; başlıktaki anahtar siz okurken tüm önerileri bir kerede gizler.',
  'help.guide.suggestions.tip.1': 'İki güne yayılan bir yer her birinde bir öneri verir.',
  'help.guide.suggestions.tip.2': 'Öneriler istatistiklerde asla sayılmaz; yalnızca yazılmış kayıtlar sayılır.',
  // add-on-day
  'help.guide.add-on-day.title': 'Daha önceki bir güne kayıt ekleyin',
  'help.guide.add-on-day.goal': 'Geçmiş bir gün hakkında, tarihi sonradan düzeltmeden yazın.',
  'help.guide.add-on-day.step.1': 'O günün başlığındaki + işaretine tıklayın.',
  'help.guide.add-on-day.step.2': 'Düzenleyici o tarih ayarlı olarak açılır. Her zamanki gibi yazın ve Kaydet.',
  'help.guide.add-on-day.result': 'Kayıt doğrudan doğru güne düşer.',
  'help.guide.add-on-day.tip.1': 'Bir gün içinde, bir kaydın menüsündeki oklar onu öne ya da arkaya taşır.',
  // pros-cons
  'help.guide.pros-cons.title': 'Bir değerlendirme ekleyin',
  'help.guide.pros-cons.goal': 'Bir günü neyin harika olduğu ve neyin olmadığıyla özetleyin.',
  'help.guide.pros-cons.step.1':
    'Düzenleyicide hikâyenin altında Artılar ve Eksiler bölümünü bulun. Artılar ya da Eksiler alanına bir madde yazın ve bir sonraki için Bir tane daha ekle seçeneğini kullanın.',
  'help.guide.pros-cons.step.2': 'Kaydet. Değerlendirme kartta iki kısa liste olarak görünür.',
  'help.guide.pros-cons.result': 'Hikâyenin altında bir bakışta başparmak yukarı ve başparmak aşağı.',
  'help.guide.pros-cons.tip.1':
    'Değerlendirme kullanmayan bir Journey, bölümü Journey Ayarları içindeki Kayıt alanları altından kapatabilir.',
  // search-journey
  'help.guide.search-journey.title': 'Uzun bir günlükte bir şey bulun',
  'help.guide.search-journey.goal': 'Haftalarca kaydırmadan aradığınız kayda ulaşın.',
  'help.guide.search-journey.step.1':
    'Araç çubuğundaki Bu yolculukta ara alanına yazın. Zaman çizelgesi siz yazdıkça başlıklar, hikâyeler, yerler ve etiketler üzerinden süzülür. Aksanlar ve büyük-küçük harf önemli değildir.',
  'help.guide.search-journey.step.2':
    'Başlıktaki öneri anahtarı siz okurken yazılmamış kartları gizler. Zaman çizelgesi uzadığında alt kenarının üstünde iki yuvarlak düğme yüzer: en üste dön ve son kayda atla.',
  'help.guide.search-journey.result':
    'Yalnızca eşleşen kayıtlar kalır; her şeyi yeniden görmek için kutuyu temizleyin.',
  'help.guide.search-journey.tip.1':
    'Süren bir Journey bugünde açılır, bu yüzden güncel sayfa genellikle zaten görünürdedir.',
  'help.guide.search-journey.tip.2': 'Etiketler de sayılır: gizli hazine araması o etiketi taşıyan her kaydı bulur.',
  // gallery-map
  'help.guide.gallery-map.title': 'Galeriye ve haritaya göz atın',
  'help.guide.gallery-map.goal': 'Tüm Journey’i resimler olarak ve haritada yerler olarak görün.',
  'help.guide.gallery-map.step.1':
    'Araç çubuğunda Galeri sekmesine geçin: her kaydın her fotoğrafı, artı doğrudan galeriye yüklenen resimler. Işık kutusu için birine tıklayın.',
  'help.guide.gallery-map.step.2':
    'Sağdaki harita kayıtları tarih sırasında iğneler olarak, bağlı gezilerin yerlerini ve o gezilere aktarılmış her GPX izini planlayıcıdaki rengiyle gösterir.',
  'help.guide.gallery-map.result':
    'Adı için bir izin üzerine gelin. Kayıtlar arasındaki kesikli çizgiyi TREK çizer; iz ise gerçekten kaydettiğiniz rotadır.',
  'help.guide.gallery-map.tip.1': 'İzler bir Journey için Journey Ayarları altından kapatılabilir.',
  'help.guide.gallery-map.tip.2':
    'Konumu olan galeri fotoğrafları, hem Galeri hem Harita paylaşıldığında herkese açık haritada da görünür.',
  // entry-fields
  'help.guide.entry-fields.title': 'Kayıt alanlarını kapatın',
  'help.guide.entry-fields.goal': 'Düzenleyiciyi bu Journey’in kullandıklarıyla sınırlı tutun.',
  'help.guide.entry-fields.step.1': 'Başlıktan Journey Ayarları’nı açın.',
  'help.guide.entry-fields.step.2':
    'Kayıt alanları altında Ruh hâli, Hava durumu ya da Artılar ve eksiler seçeneğini kapatın.',
  'help.guide.entry-fields.result':
    'Düzenleyici artık onları sormaz. Yazılmış hiçbir şey kaybolmaz: bir alanı yeniden açmak saklanan değerleri görünür kılar ve paylaşılan bir günlük aynı alanları gizler.',
  'help.guide.entry-fields.tip.1':
    'Anahtarlar Journey başınadır, bu yüzden bir iş gezisi ile bir tatil farklı olabilir.',
  // link-trip
  'help.guide.link-trip.title': 'Başka bir gezi bağlayın',
  'help.guide.link-trip.goal': 'İkinci bir gezinin yerlerini öneri olarak günlüğe getirin.',
  'help.guide.link-trip.step.1': 'Başlıktan Journey Ayarları’nı açın.',
  'help.guide.link-trip.step.2': 'Bağlı gezilerin altında Seyahat Ekle seçeneğine tıklayın.',
  'help.guide.link-trip.step.3': 'Geziyi seçin.',
  'help.guide.link-trip.result':
    'Yerleri kendi günlerinde öneri olarak zaman çizelgesine gelir ve GPX izleri haritaya katılır.',
  'help.guide.link-trip.tip.1': 'Bağlı bir gezinin yanındaki × bağını yeniden çözer; yazdığınız kayıtlar kalır.',
  'help.guide.link-trip.tip.2': 'Bir günü olan kayıtlar, o günü kaç gezi kapsarsa kapsasın yalnızca bir kez sayılır.',
  // share-public
  'help.guide.share-public.title': 'Journey’i herkese açık paylaşın',
  'help.guide.share-public.goal': 'TREK hesabı olmayan kişilere salt okunur bir bağlantı verin.',
  'help.guide.share-public.step.1': 'Journey Ayarları’nı açın ve Herkese açık paylaşım bölümünü bulun.',
  'help.guide.share-public.step.2': 'Paylaşım bağlantısı oluştur seçeneğine tıklayın.',
  'help.guide.share-public.step.3':
    'Ziyaretçilerin ne göreceğini seçin: Zaman çizelgesi, Galeri ve Harita ayrı anahtarlardır. Kopyala bağlantıyı panonuza koyar.',
  'help.guide.share-public.result':
    'Bağlantıya sahip herkes etkin bölümleri görür, başka hiçbir şeyi değil; Kayıt alanları içinde kapattığınız alanlar orada da gizli kalır.',
  'help.guide.share-public.tip.1':
    'Fotoğraflar herkese açık haritada yalnızca Galeri ve Harita birlikte açıkken görünür; Harita kapalıyken koordinatları sunucudan ayrılmadan önce silinir.',
  'help.guide.share-public.tip.2': 'Paylaşımı bitirmek için bağlantıyı aynı yerden silin.',
  // contributors
  'help.guide.contributors.title': 'Birlikte yazın',
  'help.guide.contributors.goal': 'Bir yol arkadaşının kendi kayıtlarını ve fotoğraflarını eklemesine izin verin.',
  'help.guide.contributors.step.1': 'Journey Ayarları’nı açın ve katkıda bulunanlara kaydırın.',
  'help.guide.contributors.step.2':
    'Katkıda bulunan davet et seçeneğine tıklayın ve kullanıcıyı ada ya da e-postaya göre arayın.',
  'help.guide.contributors.step.3': 'Bir rol seçin ve onaylayın.',
  'help.guide.contributors.result':
    'Journey onların listesinde görünür ve kayıtları adlarını taşır. Bir katkıda bulunanı yanındaki × ile kaldırın.',
  'help.guide.contributors.tip.1':
    'Katkıda bulunanlar bu TREK’teki kişiler içindir. Diğer herkes için herkese açık bağlantı vardır.',
  // studio
  'help.guide.studio.title': 'Journey’i fotoğraf kitabı olarak yerleştirin',
  'help.guide.studio.goal': 'Günlüğü yazdırılabilir sayfalara dönüştürün.',
  'help.guide.studio.step.1': 'Başlıkta Studio seçeneğine tıklayın. Tasarımcı Journey’in üstünde açılır.',
  'help.guide.studio.step.2': 'Üst çubuğun solundaki Journey adı geri dönüş yoludur; sizi bulunduğunuz yere bırakır.',
  'help.guide.studio.result':
    'Solda sayfa rayı, tezgâhta çift sayfa, sağda özellikler. Auto layout kitabı kayıtlarınızdan kurar; Export baskıya hazır bir PDF üretir.',
  'help.guide.studio.tip.1': 'Studio en az 1024 px genişliğinde bir pencere ister ve telefonda sunulmaz.',
  'help.guide.studio.tip.2':
    'Kitap Journey’in erişimini devralır: Journey’i okuyabilen açabilir, düzenleyebilen kaydedebilir.',
  // archive-journey
  'help.guide.archive-journey.title': 'Bir Journey’i arşivleyin ya da silin',
  'help.guide.archive-journey.goal': 'Bitmiş bir Journey’i kapatın ya da birini kalıcı olarak kaldırın.',
  'help.guide.archive-journey.step.1': 'Journey Ayarları’nı açın.',
  'help.guide.archive-journey.step.2':
    "En altta Journey'i Arşivle onu bitirir ve arşivlenmiş olarak işaretler; Journey'i geri aç geri getirir. Sil, onaydan sonra tüm kayıt ve fotoğraflarıyla kaldırır.",
  'help.guide.archive-journey.result':
    'Arşivlenmiş bir Journey okunabilir ve paylaşılabilir kalır; yalnızca artık bugünde açılmaz.',
  'help.guide.archive-journey.tip.1': 'Silme geri alınamaz ve Journey’in bağlı olduğu gezilere dokunmaz.',
  'help.guide.archive-journey.tip.2': 'Kapak, ad ve alt başlık aynı iletişim kutusunda, en üsttedir.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio bir journey’i basılabilir bir fotoğraf kitabı olarak düzenler. Günlüğün üzerinde açılır: solda sayfa şeridi ve içerik, ortada üzerinde çalıştığınız çift sayfa, sağda onun özellikleri. Auto layout kayıtlarınızdan ilk taslağı kurar; sonrası tamamen sizindir: taşıyın, kırpın ve yeniden biçimlendirin, her adım için geri alma ile.',
  'help.ctx.journey-studio.bullet.1':
    'Üst çubuk: Back to the journey, Book view, Undo ve Redo, Page format, Auto layout ve Export. Başlığın yanındaki Kaydedildi işareti kitabın ne zaman kaydedildiğini söyler.',
  'help.ctx.journey-studio.bullet.2':
    'Solda beş bölümlü şerit: Pages, Content (journey’in fotoğrafları ve kayıtları), Elements (metin, şekiller, çizgiler, ızgaralar, çerçeveler, simgeler), Seyahat (journey’den kurulan haritalar, ülkeler, bayraklar ve işaretler) ve Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Çalışma alanı: taşma payı ve güvenli kenar boşluklarıyla geçerli çift sayfa, altında yakınlaştırma çubuğu, Fit to view ve sağda Bu çift sayfayı indir.',
  'help.ctx.journey-studio.bullet.4':
    'Sağda Properties: seçili olanın konumu ve boyutu, kırpma ve odak noktası, doldurma ya da sığdırma, görünüm, köşeler, çerçeve, katman sırası ve kilidi; hiçbir şey seçili değilken sayfa numaraları ve belge.',
  'help.ctx.journey-studio.bullet.5':
    'Kitap ciltli bir kitabın biçimindedir: kapak, tek bir ilk sayfa, çift sayfalar, tek bir son sayfa ve arka kapak. Sayfa numaraları ilk sayfadan başlar ve gösterildiği gibi basılır.',
  'help.ctx.journey-studio.bullet.6':
    'Birden çok kişi aynı anda tasarlayabilir: herkes diğerlerinin imleçlerini adlarıyla görür ve başkasının bu arada değiştirdiği bir sürümü kaydetmek, onun çalışmasının üzerine yazmak yerine bir çakışma olarak geri döner.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Kitabı otomatik kurun',
  'help.guide.studio-auto-layout.goal':
    'Günlüğün kayıtlarından ve fotoğraflarından tek tıkla eksiksiz bir ilk taslak alın.',
  'help.guide.studio-auto-layout.step.1': 'Üst çubukta Auto layout öğesine tıklayın.',
  'help.guide.studio-auto-layout.step.2':
    'Tüm kitap seçeneğini seçin: başlığınızı ve sayfa ayarlarınızı koruyarak her sayfayı değiştirir. Bu sayfa yalnızca ekrandakini yeniden kurar ve bir kayıttan gelen çift sayfada sunulur.',
  'help.guide.studio-auto-layout.step.3':
    'Sayfa şeridine göz atın. Öncekini daha çok beğendiyseniz Undo düzenin tamamını geri alır.',
  'help.guide.studio-auto-layout.result':
    'Kayıt başına bir çift sayfa, sırayla, fotoğrafları, başlığı ve hikâyesi sizin için yerleştirilmiş olarak. Her öğe, siz düzenleyene kadar kaydını izlemeye devam eder.',
  'help.guide.studio-auto-layout.tip.1': 'İki seçenek de sıradan geri alma adımlarıdır, o yüzden rahatça deneyin.',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout’un bir kayda bağladığı öğe, siz Properties içinde ona dokunana kadar o kaydın düzenlemelerine ayak uydurur; bu, bağlantıyı koparır.',
  // studio-pages
  'help.guide.studio-pages.title': 'Çift sayfa ekleyin, taşıyın ve kaldırın',
  'help.guide.studio-pages.goal': 'Kitabı sayfa sayfa biçimlendirin.',
  'help.guide.studio-pages.step.1':
    'Şeritte Pages bölümünü açın. Küçük resimler kitabın sırasıdır: kapak, ilk sayfa, çift sayfalar, son sayfa, arka kapak.',
  'help.guide.studio-pages.step.2':
    'Alttaki Sayfa ekle yeni bir çift sayfayı son sayfanın önüne koyar; iki küçük resim arasındaki + tam oraya ekler.',
  'help.guide.studio-pages.step.3':
    'İşlemleri için bir küçük resmin üzerine gelin: Öne al, Arkaya al, Sayfayı çoğalt ve Sayfayı sil. O çift sayfayı çalışma alanında açmak için küçük resme tıklayın.',
  'help.guide.studio-pages.result':
    'Kapak, ilk ve son sayfalar ile arka kapak yerinde kalır; yeni çift sayfalar her zaman bunların arasına düşer.',
  'help.guide.studio-pages.tip.1':
    'Üst çubuktaki Book view, kitabın tamamını ciltleneceği biçimde yapraklar olarak gösterir.',
  'help.guide.studio-pages.tip.2':
    'Sayfa numaraları, hiçbir şey seçili değilken Properties içindeki Belge altından açılır.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Bir çift sayfaya düzen uygulayın',
  'help.guide.studio-layouts.goal': 'Bir çift sayfaya hazır bir fotoğraf ve metin çerçevesi yerleşimi verin.',
  'help.guide.studio-layouts.step.1':
    'Şeritte Layouts bölümünü açın. On üç çift sayfa düzeni ve kapak, arka kapak ile tek sayfalar için ayrı bir küme.',
  'help.guide.studio-layouts.step.2':
    'Birine tıklayın. Çalışma alanındaki çift sayfa onun çerçevelerini alır; zaten sahip olduğunuz fotoğraflar ve metin bunların içine dökülür.',
  'help.guide.studio-layouts.result':
    'Boş çerçeveler içerik bekler: Content içinden birine bir fotoğraf sürükleyin ya da Add to this page kullanın.',
  'help.guide.studio-layouts.tip.1': 'Bir düzen, diğerleri gibi bir geri alma adımıdır.',
  // studio-content
  'help.guide.studio-content.title': 'Fotoğrafları ve kayıtları bir sayfaya koyun',
  'help.guide.studio-content.goal': 'Journey’in kendi malzemesini çift sayfaya taşıyın.',
  'help.guide.studio-content.step.1':
    'Şeritte Content bölümünü açın. Photos journey’in her resmini listeler; Entries kayıtları metinleriyle listeler.',
  'help.guide.studio-content.step.2':
    'Bir fotoğrafı çift sayfaya ya da boş bir çerçeveye sürükleyin veya altındaki Add to this page öğesine tıklayın. Fotoğraf yükle, henüz journey’de olmayan resimleri ekler.',
  'help.guide.studio-content.step.3':
    'Bir kaydın altında Title, Story ve Place o metni sayfaya bir metin öğesi olarak koyar; Tarih ve koordinatlar işaret olarak gelir ve kaydın fotoğrafları hemen orada listelenir.',
  'help.guide.studio-content.result':
    'Bırakılan fotoğraf bir fotoğraf öğesi olur; metin siz düzenleyene kadar kaydı izlemeye devam eder.',
  'help.guide.studio-content.tip.1': 'Content’in üstündeki arama kutusu iki listeyi de süzer.',
  'help.guide.studio-content.tip.2':
    'Masaüstünüzden çalışma alanına bir dosya bırakmak onu tek seferde yükler ve yerleştirir.',
  // studio-elements
  'help.guide.studio-elements.title': 'Metin, şekil ve simge ekleyin',
  'help.guide.studio-elements.goal': 'Bir çift sayfayı fotoğraf ve hikâyelerin ötesinde süsleyin.',
  'help.guide.studio-elements.step.1': 'Şeritte Elements bölümünü açın.',
  'help.guide.studio-elements.step.2':
    'Başlık ya da alt yazı için bir metin stiline, bir şekle, bir çizgiye, bir ızgaraya, çerçeve stilli boş bir çerçeveye ya da aranabilir kitaplıktan bir simgeye tıklayın. Her biri çift sayfanın ortasına, taşınmaya hazır olarak düşer.',
  'help.guide.studio-elements.result':
    'İçine yazmak için bir metin öğesine çift tıklayın; yazı tipi, kalınlık, boyut, aralık ve hizalama Properties içindedir.',
  'help.guide.studio-elements.tip.1': 'Çerçeveler boş fotoğraf yuvalarıdır: resmi sonra bırakın.',
  // studio-travel
  'help.guide.studio-travel.title': 'Harita, bayrak ve rakamlar ekleyin',
  'help.guide.studio-travel.goal': 'Journey’in kendisini sayfadaki rakamlara dönüştürün.',
  'help.guide.studio-travel.step.1': 'Şeritte Seyahat bölümünü açın.',
  'help.guide.studio-travel.step.2':
    'Ne ekleyeceğinizi seçin: kayıtların rota haritası, ülke sınırları, ülke listesi ya da ızgarası, bayraklar, tarih, gün ya da mesafe işareti veya tüm gezinin özeti. Her biri journey’in verisinden kurulur ve onunla yenilenir.',
  'help.guide.studio-travel.result': 'Öğe çift sayfada belirir; Properties stilini, haritanın ise alanını ayarlar.',
  'help.guide.studio-travel.tip.1':
    'İşaretler çift sayfanın geldiği kaydı izler, bu yüzden otomatik kurulmuş bir çift sayfadaki tarih işareti o günü zaten gösterir.',
  // studio-properties
  'help.guide.studio-properties.title': 'Seçtiğinizi düzenleyin',
  'help.guide.studio-properties.goal': 'Denetleyici ile bir öğeyi taşıyın, kırpın, biçimlendirin ve katmanlayın.',
  'help.guide.studio-properties.step.1':
    'Çift sayfada bir öğeye tıklayın. Boyut ve döndürme için tutamaçlar belirir; taşımak için sürükleyin.',
  'help.guide.studio-properties.step.2':
    'Sağdaki Properties seçimi izler: konum ve boyut, çerçevede neyin kalacağına karar veren odak noktasıyla Crop, Dolgu ya da sığdırma, Look filtreleri, Corner yarıçapı, Çerçeve, katman sırası ve Lock.',
  'help.guide.studio-properties.step.3':
    'Çoğalt ve Delete denetleyicinin üstündedir; üst çubuktaki Undo bunların hepsini geri alır.',
  'help.guide.studio-properties.result':
    'Kilitli bir öğe artık sayfada tutulamaz, bu da siz çevresinde çalışırken bitmiş bir düzeni güvende tutar.',
  'help.guide.studio-properties.tip.1':
    'Shift ile tıklamak birden çok öğe seçer; denetleyici o zaman hepsini birlikte düzenler.',
  'help.guide.studio-properties.tip.2':
    'Auto layout’un yerleştirdiği bir öğeyi düzenlemek kayıtla bağlantısını koparır; o kaydın sonraki değişikliklerini izlemeyi bırakır.',
  // studio-format
  'help.guide.studio-format.title': 'Sayfa biçimini seçin',
  'help.guide.studio-format.goal': 'Düzen ona bağlı hale gelmeden önce kitabın basılacağı boyutu ayarlayın.',
  'help.guide.studio-format.step.1': 'Üst çubukta Page format öğesine tıklayın.',
  'help.guide.studio-format.step.2':
    'Square 21 × 21 cm, Square 30 × 30 cm, A4 ya da A5 landscape veya portrait seçin ya da milimetre cinsinden özel bir genişlik ve yükseklik girin. Taşma ve Güvenli bunların altındadır.',
  'help.guide.studio-format.result':
    'Her çift sayfa o boyutta çizilir, varsayılan olarak 3 mm taşma payı ve 5 mm güvenli kenar boşluğu ile.',
  'help.guide.studio-format.tip.1':
    'Önce biçimi değiştirin, sonra Auto layout çalıştırın; düzen bulduğu boyut için kurulur.',
  'help.guide.studio-format.tip.2': 'Matbaanıza taşma payı ve güvenli alan değerlerini sorun ve onları girin.',
  // studio-export
  'help.guide.studio-export.title': 'Kitabı PDF olarak dışa aktarın',
  'help.guide.studio-export.goal': 'Baskıya hazır bir dosya ya da ekranda okunacak bir dosya alın.',
  'help.guide.studio-export.step.1': 'Üst çubukta Export öğesine tıklayın.',
  'help.guide.studio-export.step.2':
    'Tek sayfa seçin, okuma sırasında yaprak başına bir sayfa, ki matbaanın istediği budur, ya da Çift sayfa, kitabın açıldığı gibi her seferinde iki sayfa. Kesim işaretleri her kenara taşma payını ekler ve nereden kesileceğini işaretler.',
  'help.guide.studio-export.step.3':
    'Yazdırma görünümü öğesine tıklayın. Tarayıcınız sayfaları açar ve PDF olarak kaydet onları dosyaya dönüştürür.',
  'help.guide.studio-export.result':
    'İletişim kutusunun duyurduğu kadar yapraklı, ayarladığınız sayfa biçiminde bir PDF.',
  'help.guide.studio-export.tip.1': 'PDF oluşturmak, Studio’nun kendisi gibi yalnızca masaüstünde çalışır.',
  'help.guide.studio-export.tip.2':
    'Prova için Çift sayfa seçeneğini kesim işaretleri olmadan, matbaa için Tek sayfa seçeneğini kesim işaretleriyle dışa aktarın.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Bir çift sayfayı başka bir kitapta yeniden kullanın',
  'help.guide.studio-spread-file.goal': 'Beğendiğiniz bir tasarımı bir journey’in kitabından diğerine taşıyın.',
  'help.guide.studio-spread-file.step.1':
    'Çift sayfa çalışma alanındayken yakınlaştırma çubuğunun sağ ucundaki Bu çift sayfayı indir öğesine tıklayın. Dosya tasarımı içerir, fotoğrafları değil.',
  'help.guide.studio-spread-file.step.2':
    'Diğer kitapta Pages bölümünü açın, Sayfa ekle yanındaki İçe aktar öğesine tıklayın ve dosyayı seçin.',
  'help.guide.studio-spread-file.result':
    'Çift sayfa çerçeveleri ve metin stilleriyle gelir; yeni journey’in fotoğraflarını çerçevelere bırakın.',
  'help.guide.studio-spread-file.tip.1': 'Çift sayfa tasarımı olmayan bir dosya, nedeni belirtilerek reddedilir.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ayarlar',
  'help.ctx.settings.summary':
    'Kişisel ayarlarınız, soldaki kenar çubuğunda her konu için bir sekme. Anahtarların çoğu çevirdiğiniz anda uygulanır; altında Kaydet düğmesi olan bir form onu bekler. Buradaki hiçbir şey başkasının TREK’ini değiştirmez.',
  'help.ctx.settings.bullet.1':
    'Soldaki kenar çubuğu: Görünüm, Appearance, Harita, Bildirimler, Entegrasyonlar, Çevrimdışı ve Hesap. Eklentiler bir tane kurulduğunda, Hakkında ise yöneticinin kaldırmadığı her yerde görünür.',
  'help.ctx.settings.bullet.2':
    'Görünüm dil, birimler, para birimi ve uygulamanın neyle açılacağıdır; Appearance tema, renkler, metin boyutu ve pano bileşenleridir.',
  'help.ctx.settings.bullet.3':
    'Harita çizim motorunu ve stilini seçer; Bildirimler size ulaşan kanalları; Entegrasyonlar fotoğraf kitaplıklarını, API anahtarlarını ve MCP’yi; Çevrimdışı uygulamanın bu cihazda tuttuklarını.',
  'help.ctx.settings.bullet.4':
    'Hesap profilinizi, şifrenizi, iki faktörlü kimlik doğrulamayı, passkey’leri ve hesabınızın silinmesini barındırır.',
  'help.ctx.settings-display.title': 'Görünüm',
  'help.ctx.settings-display.summary':
    'Dil, birimler ve para birimi, haritanın ve rezervasyonların nasıl davrandığı ve TREK’in neyle açılacağı. Buradaki her değişiklik hemen uygulanır.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: arayüz dili, saat biçimi, haftanın ilk günü, görüntüleme para birimi ile mesafe ve sıcaklık birimleri.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: rezervasyon rotaları her zaman haritada, Yerleri keşfet hapı, konaklamadan rota optimizasyonu, bulanık rezervasyon kodları ve etiketli rezervasyon rotaları.',
  'help.ctx.settings-display.bullet.3':
    'Başlangıç: TREK’in panoda mı yoksa aktif gezide mi açılacağı ve bir gezinin hangi sekmesinin önce geleceği.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'TREK’in bu hesapta nasıl göründüğü: açık ya da koyu, vurgu rengi, cam ve hareket, metin boyutu ve panonun hangi bileşenleri gösterdiği. Her şey canlı olarak, oturum açtığınız her cihazda uygulanır.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Açık, Koyu ya da Otomatik ve size ait bir Custom accent ile Color scheme.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density ve Text size, kademe başına gelişmiş boyutlarla.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: bileşen başına bir anahtar, Desktop ve Mobile için ayrı ayrı.',
  'help.ctx.settings-appearance.bullet.4': 'Alttaki Reset to defaults her şeyi geri alır.',
  'help.ctx.settings-map.title': 'Harita',
  'help.ctx.settings-map.summary':
    'Haritaları hangi motorun hangi stilde çizdiği. Leaflet klasik raster haritadır, MapLibre hiçbir anahtar olmadan vektör kutucukları çizer, Mapbox kendi anahtarınızla 3B binalar ve arazi ekler.',
  'help.ctx.settings-map.bullet.1':
    'Harita Sağlayıcısı: Leaflet, MapLibre ya da Mapbox, her biri neye ihtiyaç duyduğunu söyleyen bir satırla.',
  'help.ctx.settings-map.bullet.2':
    'Harita Stili ve Harita Şablonu: kutucukların görünümü, artı bir sağlayıcının istediği anahtar ya da token.',
  'help.ctx.settings-map.bullet.3':
    'Kenar yumuşatma ve küre projeksiyonu için Yüksek Kalite Modu; Haritayı Kaydet seçimi yazar.',
  'help.ctx.settings-notifications.title': 'Bildirimler',
  'help.ctx.settings-notifications.summary':
    'TREK’in size uygulama dışında nereden ulaştığı: bu cihazdaki anlık bildirimler, bir ntfy konusu, bir web kancası ya da bir eklentinin sağladığı kanal. Kanalların altında, olay başına bir satır neyin nereye gideceğine karar verir.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: konu, isteğe bağlı kendi sunucunuz ve isteğe bağlı bir erişim anahtarı, hemen bir tane göndermek için Dene ile.',
  'help.ctx.settings-notifications.bullet.2': 'Web kancası: her olayı JSON olarak alan tek bir URL, Dene ile.',
  'help.ctx.settings-notifications.bullet.3':
    'Bu cihazda anlık bildirimler: Bu cihaz için aç yalnızca kullandığınız tarayıcıyı kapsar, bu yüzden bunu her telefonda veya bilgisayarda tekrarlayın. Test gönder hepsine ulaşır.',
  'help.ctx.settings-notifications.bullet.4':
    'Tercih satırları: olay başına hangi kanalın açık olduğu. Eklenti kanalları kurulana kadar Yapılandır gösterir.',
  'help.ctx.settings-integrations.title': 'Entegrasyonlar',
  'help.ctx.settings-integrations.summary':
    'TREK’e dışarıdan bağlanan her şey: günlük için fotoğraf kitaplıkları, betikler için API anahtarları ve yapay zekâ asistanları için jetonları ve OAuth istemcileriyle MCP uç noktası.',
  'help.ctx.settings-integrations.bullet.1':
    'Fotoğraf sağlayıcıları: Immich ve Synology Photos, her biri URL’si ve anahtarıyla, Bağlantıyı test et ve Kaydet.',
  'help.ctx.settings-integrations.bullet.2':
    'API Anahtarları: TREK API’sini sizin adınıza çağıran betikler ve diğer araçlar için kişisel anahtarlar.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP Yapılandırması: uç nokta, kopyalamak için hazır bir istemci yapılandırması ve API jetonları.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1 İstemcileri: TREK üzerinden oturum açan uygulamalar, yönlendirme URI’leri, izin verilen kapsamlar, makine istemcileri ve aktif oturumlarla.',
  'help.ctx.settings-offline.title': 'Çevrimdışı',
  'help.ctx.settings-offline.summary':
    'Bir gezinin bağlantı olmadan da açılması için TREK’in bu cihazda tuttukları ve çevrimdışı yapılan bir değişiklik başka yerde yapılanla çakıştığında ne olacağı.',
  'help.ctx.settings-offline.bullet.1':
    'Çevrimdışı mod: Çevrimdışı modu zorla, test için ya da kotalı bir bağlantıda uygulamayı ağ yokmuş gibi davrandırır.',
  'help.ctx.settings-offline.bullet.2':
    'Çevrimdışı için hazırlan: Çevrimdışı kullanım için indir gezilerinizi ve harita kutucuklarını şimdi getirir.',
  'help.ctx.settings-offline.bullet.3':
    'Çevrimdışı olarak ne saklanacak: harita kutucukları açık ya da kapalı ve gezi başına bir anahtar.',
  'help.ctx.settings-offline.bullet.4':
    'Senkronizasyon çakışmaları ve Çevrimdışı önbellek: çakışma stratejisi, bekleyen ve başarısız sayıları, Şimdi yeniden senkronize et ve Önbelleği temizle.',
  'help.ctx.settings-account.title': 'Hesap',
  'help.ctx.settings-account.summary':
    'Bu TREK’te kim olduğunuz ve nasıl oturum açtığınız: profil ve avatar, şifre, iki faktörlü kimlik doğrulama, passkey’ler ve en altta hesabın silinmesi.',
  'help.ctx.settings-account.bullet.1': 'Profil: kullanıcı adı, e-posta ve avatar, Profili Kaydet ile kaydedilir.',
  'help.ctx.settings-account.bullet.2': 'Şifre Değiştir: mevcut şifre, yeni şifre iki kez, Şifreyi güncelle.',
  'help.ctx.settings-account.bullet.3':
    'Bir kimlik doğrulayıcı uygulaması ve yedekleme kodlarıyla İki faktörlü kimlik doğrulama (2FA); şifresiz oturum açmak için Passkey’ler.',
  'help.ctx.settings-account.bullet.4': 'En altta, bir onayın arkasında Hesabı sil. Son yönetici kendini silemez.',
  // language-region
  'help.guide.language-region.title': 'Dil, birimler ve para birimini ayarlayın',
  'help.guide.language-region.goal': 'TREK sizin dilinizi konuşsun ve sizin saydığınız gibi saysın.',
  'help.guide.language-region.step.1':
    'Language & region altında arayüz dilini seçin. TREK oturum açtığınız her cihazda hemen geçiş yapar.',
  'help.guide.language-region.step.2':
    'Altında saat biçimini, tüm tarih seçicilerde haftanın hangi günle başlayacağını, görüntüleme para birimini ile mesafe ve sıcaklık birimlerini seçin.',
  'help.guide.language-region.result':
    'Tarihler, mesafeler ve para beklediğiniz gibi okunur; bir gezinin kendi para birimi dönüştürülen tutarların yanında görünmeye devam eder.',
  'help.guide.language-region.tip.1':
    'Görüntüleme para birimi geziler arası toplamlar içindir; her gezi ona verdiğiniz para birimini korur.',
  'help.guide.language-region.tip.2': 'Dil, Vacay’deki ve günlükteki gün ve ay adlarını da belirler.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Haritanın ve rezervasyonların davranışını ayarlayın',
  'help.guide.travel-map-prefs.goal': 'Gezi haritasının varsayılan olarak ne göstereceğine karar verin.',
  'help.guide.travel-map-prefs.step.1':
    'Travel & map altında Rezervasyon rotalarını her zaman göster, günleri açık olmasa bile uçuşları ve trenleri haritada tutar; Haritada yerleri keşfet yer bulma hapını gösterir; Rotayı konaklamadan optimize et rotayı uyuduğunuz yerden başlatır.',
  'help.guide.travel-map-prefs.step.2':
    'Rezervasyon Kodlarını Bulanıklaştır, üzerine gelene kadar onay numaralarını gizler; Rezervasyon rota etiketleri rezervasyon adını rotası boyunca yazar.',
  'help.guide.travel-map-prefs.result': 'Gezi haritası, siz geri çevirene kadar bunlara her gezide uyar.',
  'help.guide.travel-map-prefs.tip.1':
    'Bunlar gezi başına değil, hesap başınadır. Paylaşılan bir gezinin üyeleri her biri kendi seçimlerini görür.',
  // startup
  'help.guide.startup.title': 'TREK’in neyle açılacağını seçin',
  'help.guide.startup.goal': 'Her seferinde panoya değil, en çok çalıştığınız yere inin.',
  'help.guide.startup.step.1':
    'Başlangıç altında Başlangıç sayfası seçeneğini Pano ya da Aktif seyahat olarak ayarlayın.',
  'help.guide.startup.step.2': 'Başlangıç sekmesi, bir gezi açtığınızda hangi sekmesinin önce geleceğini seçer.',
  'help.guide.startup.result': 'Bir sonraki oturum açma ve logoya bir sonraki dokunuş doğrudan oraya gider.',
  'help.guide.startup.tip.1': 'Aktif seyahat bugün süren gezi, hiçbiri sürmüyorsa bir sonraki demektir.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Temayı ve vurgu rengini ayarlayın',
  'help.guide.theme-scheme.goal': 'TREK’i açık, koyu ya da cihazınızı izler yapın, sevdiğiniz renkte.',
  'help.guide.theme-scheme.step.1': 'Theme altında Açık, Koyu ya da Otomatik seçin. Otomatik cihazınızı izler.',
  'help.guide.theme-scheme.step.2':
    'Bir Color scheme seçin: Default, High contrast, Indigo, Teal, Rose, Amber, Violet ya da Custom.',
  'help.guide.theme-scheme.step.3':
    'Custom ile hazır seçeneklerden bir vurgu seçin ya da kendinizinkini girin. Yanındaki kontrast denetimi metnin üzerinde okunur kalıp kalmayacağını söyler.',
  'help.guide.theme-scheme.result':
    'Düğmeler, bağlantılar ve vurgular oturum açtığınız her cihazda, her yerde bu rengi alır.',
  'help.guide.theme-scheme.tip.1':
    'Gezinti çubuğunda da hızlı bir açık ya da koyu anahtarı vardır; aynı temayı ayarlar.',
  'help.guide.theme-scheme.tip.2': 'High contrast, varsayılan fazla yumuşak okunduğunda seçilecek şemadır.',
  // readability
  'help.guide.readability.title': 'Okunabilirliği ve metin boyutunu ayarlayın',
  'help.guide.readability.goal': 'Daha az cam, daha az hareket, daha fazla yer ya da daha büyük yazı.',
  'help.guide.readability.step.1':
    'Readability altında Transparency cam panelleri düz yüzeylere çevirir, Reduce motion animasyonları en aza indirir ve Density Comfortable ya da Compact seçer.',
  'help.guide.readability.step.2':
    'Text size, Everything seçeneğiyle hepsini bir kerede ölçekler; Advanced text sizes başlıkların, alt başlıkların, gövde metninin ve açıklamaların farklı olmasına izin verir.',
  'help.guide.readability.result': 'Harita panelleri ve günlük dahil tüm uygulama hemen uyar.',
  'help.guide.readability.tip.1': 'Reduce motion, ona dokunmadığınızda sisteminizin ayarını da izler.',
  'help.guide.readability.tip.2':
    'Metin boyutu tipografi kademeleri üzerinden uygulanır, bu yüzden hiçbir şey kesilmez; artık sığmayan bir boyut satır kaydırır.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Pano bileşenlerini seçin',
  'help.guide.dashboard-widgets.goal':
    'Yalnızca kullandığınız bileşenleri gösterin, masaüstünde ve telefonda ayrı ayrı.',
  'help.guide.dashboard-widgets.step.1':
    'Dashboard widgets altında her bileşeni Desktop ve Mobile için açın ya da kapatın: sağ kenar çubuğunun tamamı, para birimi, koleksiyonlar, saat dilimleri, yaklaşan rezervasyonlar, Atlas ülkeleri ve seyahat rakamları.',
  'help.guide.dashboard-widgets.step.2': 'Alttaki Reset to defaults sekmenin tamamını ilk haline döndürür.',
  'help.guide.dashboard-widgets.result': 'Pano hemen yeniden düzenlenir; sağ kenar çubuğu kapalıyken ortalanır.',
  'help.guide.dashboard-widgets.tip.1':
    'Bir eklentinin bileşenleri yalnızca yönetici o eklentiyi açık tuttuğu sürece görünür.',
  'help.guide.dashboard-widgets.tip.2':
    'Panonun kendisi ızgara ya da liste görünümünüzü ve sıralama düzenini cihaz başına hatırlar.',
  // map-provider
  'help.guide.map-provider.title': 'Harita motorunu ve stilini seçin',
  'help.guide.map-provider.goal': 'Klasik harita, vektör kutucukları ve Mapbox’ın 3B haritası arasında geçiş yapın.',
  'help.guide.map-provider.step.1':
    'Harita Sağlayıcısı altında herhangi bir raster kutucuklu klasik 2B harita için Leaflet, anahtarsız OpenFreeMap vektör kutucukları için MapLibre ya da 3B binalı ve arazili vektör kutucukları için Mapbox seçin.',
  'help.guide.map-provider.step.2':
    'Görünüm için bir Harita Stili ya da Harita Şablonu seçin. Mapbox bir Mapbox Erişim Anahtarı, bazı raster stiller bir CARTO API anahtarı ister; alanın yanındaki bağlantı bir tane alacağınız yere götürür.',
  'help.guide.map-provider.step.3':
    'Yüksek Kalite Modu kenar yumuşatma ve küre projeksiyonu ekler. Haritayı Kaydet seçeneğine tıklayın.',
  'help.guide.map-provider.result':
    'TREK’teki her harita, geziler, Atlas, Koleksiyonlar ve günlük, seçtiğiniz motor tarafından çizilir.',
  'help.guide.map-provider.tip.1': 'Anahtar olmadan Mapbox hiçbir şey göstermek yerine varsayılan haritaya döner.',
  'help.guide.map-provider.tip.2':
    'Çevrimdışı sakladığınız harita kutucukları, onları indirdiğinizde etkin olan sağlayıcıdan gelir.',
  // notification-channels
  'help.guide.notification-channels.title': 'Bildirimlerin size nereden ulaşacağını ayarlayın',
  'help.guide.notification-channels.goal':
    'Gezi hatırlatmalarını ve iş birliği olaylarını telefonunuza ya da başka bir araca alın.',
  'help.guide.notification-channels.step.1':
    "Bildirimler altında bir Ntfy Konusu doldurun; kendi sunucunuz varsa Ntfy sunucu URL'si ve bir Erişim anahtarı ekleyin. Dene hemen bir mesaj gönderir.",
  'help.guide.notification-channels.step.2':
    "Ya da her olayı JSON olarak alan bir Web kancası URL'si verin ve aynı şekilde Dene ile deneyin.",
  'help.guide.notification-channels.step.3':
    'Alttaki satırlarda her olayı kanal başına açın ya da kapatın. Bir eklenti kanalı, eklentinin ayarlarında kurulana kadar Yapılandır der; Test gönder bir tane dener.',
  'help.guide.notification-channels.result':
    'Olaylar açık olan kanallardan gider. Gezinti çubuğundaki zil her durumda onları uygulamada göstermeye devam eder.',
  'help.guide.notification-channels.tip.1':
    'Gezi başına tercihler gezinin kendisinde, bildirim ayarlarının altında durur.',
  'help.guide.notification-channels.tip.2':
    'Yönetici herkes için varsayılan bir ntfy sunucusunu önceden doldurabilir; konunuzu yine siz seçersiniz.',
  // photo-providers
  'help.guide.photo-providers.title': 'Bir fotoğraf kitaplığı bağlayın',
  'help.guide.photo-providers.goal': 'Günlük günün fotoğraflarını Immich ya da Synology Photos’tan çeksin.',
  'help.guide.photo-providers.step.1':
    'Entegrasyonlar altında sağlayıcının bölümünü bulun ve URL’sini ile API anahtarını girin. Immich ayrıca Journey yüklemelerini kitaplığa geri yansıtmayı da önerir.',
  'help.guide.photo-providers.step.2': 'Bağlantıyı test et seçeneğine, sonra Kaydet seçeneğine tıklayın.',
  'help.guide.photo-providers.result':
    'Kayıt düzenleyicisinin External photos sekmesi bağlı kitaplıkta kaydın gününü arar, önce kaydın konumuna en yakın olanlar.',
  'help.guide.photo-providers.tip.1': 'Bağlantı sizindir: bir Journey’in diğer üyeleri kendi kitaplıklarını bağlar.',
  'help.guide.photo-providers.tip.2':
    'Fotoğraflarında GPS verisi olmayan bir sağlayıcı da çalışır; liste o zaman zaman sırasındadır.',
  // api-keys
  'help.guide.api-keys.title': 'Bir API anahtarı oluşturun',
  'help.guide.api-keys.goal': 'Bir betik ya da başka bir araç TREK API’sini sizin olarak çağırsın.',
  'help.guide.api-keys.step.1':
    'API Anahtarları altında Anahtar oluştur seçeneğine tıklayın ve ona nerede kullanılacağını söyleyen bir ad verin.',
  'help.guide.api-keys.step.2':
    'Anahtarı iletişim kutusundan kopyalayın: bir kez gösterilir. Araç artık ihtiyaç duymadığında anahtarı listeden silin.',
  'help.guide.api-keys.result':
    'O anahtarla yapılan istekler sizin izinlerinizle hareket eder; liste her anahtarın ne zaman oluşturulduğunu ve en son ne zaman kullanıldığını gösterir.',
  'help.guide.api-keys.tip.1': 'Araç başına bir anahtar iptali zahmetsiz kılar.',
  'help.guide.api-keys.tip.2':
    'Bir yapay zekâ asistanı için bunun yerine OAuth ile MCP kullanın; API anahtarları düz HTTP istemcileri içindir.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCP üzerinden bir yapay zekâ asistanı bağlayın',
  'help.guide.mcp-oauth.goal': 'Claude’a, bir IDE’ye ya da başka bir MCP istemcisine gezilerinize erişim verin.',
  'help.guide.mcp-oauth.step.1':
    'MCP Yapılandırması altında MCP Uç Noktası seçeneğini, ya da JSON parçası alan bir istemci için İstemci Yapılandırması bloğunun tamamını kopyalayın.',
  'help.guide.mcp-oauth.step.2':
    "Tarayıcı üzerinden oturum açan istemciler OAuth 2.1 kullanır: OAuth 2.1 İstemcileri altında Yeni Müşteri, URI'leri Yönlendir, İzin Verilen Kapsamlar ve tarayıcısız bir sunucu için Makine istemcisi ile.",
  'help.guide.mcp-oauth.step.3':
    'Gizli Anahtarı Döndür ve İstemciyi Sil her istemcide durur; Aktif OAuth Oturumları oturum açmış olanları listeler ve iptal etmenize izin verir. Yeni Jeton Oluştur ile API Belirteçleri daha eski giriş yoludur.',
  'help.guide.mcp-oauth.result':
    'İstemci kapsamlarının izin verdiğini sizin olarak okuyabilir ve değiştirebilir, her eylem sizin adınızın altında görünür.',
  'help.guide.mcp-oauth.tip.1':
    'Kapsamlar güvenlik ağıdır: bir istemciye daha fazlasına ihtiyaç duyana kadar yalnızca okuma kapsamını verin.',
  'help.guide.mcp-oauth.tip.2': 'Yönetici MCP’yi tüm örnek için kapatabilir; o zaman bu bölüm yoktur.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Gezileri çevrimdışına alın',
  'help.guide.offline-prepare.goal': 'Bağlantı kopmadan önce gezileriniz ve haritaları bu cihazda olsun.',
  'help.guide.offline-prepare.step.1':
    'Çevrimdışı olarak ne saklanacak altında Harita kutucuklarını çevrimdışı sakla seçeneğini açık tutun ve bu cihazda istediğiniz gezileri açın.',
  'help.guide.offline-prepare.step.2':
    'Çevrimdışı için hazırlan altındaki Çevrimdışı kullanım için indir seçeneğine tıklayın. Gezileri ve yerlerinin çevresindeki kutucukları getirir.',
  'help.guide.offline-prepare.step.3':
    'Çevrimdışı mod altındaki Çevrimdışı modu zorla, yola çıkmadan önce her şeyin yerinde olduğunu denetlemenizi sağlar.',
  'help.guide.offline-prepare.result':
    'Geziler bağlantı olmadan açılır; yaptığınız değişiklikler bir kuyrukta bekler ve yeniden bağlanınca gider.',
  'help.guide.offline-prepare.tip.1':
    'En çok yeri kutucuklar kaplar: Çevrimdışı önbellek bölümü gezi başına neyin saklandığını gösterir.',
  'help.guide.offline-prepare.tip.2': 'En sorunsuz çevrimdışı başlangıç için TREK’i tarayıcıdan uygulama olarak kurun.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Senkronizasyon çakışmasında neyin kazanacağına karar verin',
  'help.guide.offline-conflicts.goal':
    'TREK’in çevrimdışı yapılan bir değişikliği başka yerde yapılana karşı nasıl çözeceğini seçin.',
  'help.guide.offline-conflicts.step.1':
    'Senkronizasyon çakışmaları altında Her seferinde bana sor, Her zaman benim sürümümü sakla ya da Her zaman sunucu sürümünü sakla seçin.',
  'help.guide.offline-conflicts.step.2':
    'Çevrimdışı önbellek gezileri, bekleyen ve başarısız değişiklikleri ve çakışmaları gösterir; Şimdi yeniden senkronize et kuyruğu gönderir, Önbelleği temizle cihazı boşaltır.',
  'help.guide.offline-conflicts.result':
    'Sor ile bir çakışma iki sürümü de gösterir ve seçmenize izin verir; diğer ikisinde sessizce çözülür.',
  'help.guide.offline-conflicts.tip.1':
    'Önbelleği temizle yalnızca bu cihazdaki kopyayı kaldırır; sunucudaki hiçbir şeye dokunulmaz.',
  // profile
  'help.guide.profile.title': 'Profilinizi değiştirin',
  'help.guide.profile.goal': 'Adınızı, e-postanızı ve resminizi güncelleyin.',
  'help.guide.profile.step.1':
    'Hesap altında Kullanıcı adı ve E-posta alanlarını düzenleyin. Avatar kendi yüklemenizi alır; baş harflere dönmek için kaldırın.',
  'help.guide.profile.step.2': 'Profili Kaydet seçeneğine tıklayın.',
  'help.guide.profile.result': 'Adınız ve resminiz paylaştığınız geziler dahil her yerde bir kerede güncellenir.',
  'help.guide.profile.tip.1':
    'OIDC üzerinden oturum açan bir hesap bunu burada gösterir; e-posta o zaman sağlayıcıdan gelir.',
  // password
  'help.guide.password.title': 'Şifrenizi değiştirin',
  'help.guide.password.goal': 'Yeni bir şifre belirleyin.',
  'help.guide.password.step.1': 'Şifre Değiştir altında mevcut şifrenizi, sonra yenisini iki kez girin.',
  'help.guide.password.step.2': 'Şifreyi güncelle seçeneğine tıklayın.',
  'help.guide.password.result': 'Yeni şifre bir sonraki oturum açmada geçerlidir; diğer oturumlar açık kalır.',
  'help.guide.password.tip.1': 'OIDC üzerinden oturum açan bir hesabın değiştirecek bir TREK şifresi yoktur.',
  // mfa
  'help.guide.mfa.title': 'İki faktörlü kimlik doğrulamayı açın',
  'help.guide.mfa.goal': 'Hesabı bir kimlik doğrulayıcı uygulamasından gelen kodla koruyun.',
  'help.guide.mfa.step.1':
    'İki faktörlü kimlik doğrulama (2FA) altında Kimlik doğrulayıcıyı ayarla seçeneğine tıklayın.',
  'help.guide.mfa.step.2':
    "QR kodunu uygulamanızla tarayın ya da gizli anahtarı elle girin, sonra gösterdiği altı haneli kodu yazın ve 2FA'yı Etkinleştir seçeneğine tıklayın.",
  'help.guide.mfa.step.3':
    'Yedekleme kodlarını saklayın: kopyalayın, indirin ya da yazdırın. Her biri, telefonunuz elinizde olmadığında bir kez çalışır.',
  'help.guide.mfa.result': 'Her oturum açma şifreden sonra bir kod ister.',
  'help.guide.mfa.tip.1': "2FA'yı devre dışı bırak şifrenizi ve güncel bir kod ister.",
  'help.guide.mfa.tip.2': 'Yönetici 2FA’yı herkes için zorunlu kılabilir; o zaman burada kapatılamaz.',
  // passkeys
  'help.guide.passkeys.title': 'Passkey ile oturum açın',
  'help.guide.passkeys.goal': 'Şifre yerine cihazınızın parmak izini, yüzünü ya da PIN’ini kullanın.',
  'help.guide.passkeys.step.1':
    'Passkey’ler altında Passkey ekle seçeneğine tıklayın ve cihazınızla onaylayın. Ona hangi cihaz olduğunu söyleyen bir ad verin.',
  'help.guide.passkeys.step.2':
    'Liste her passkey’i adı ve en son ne zaman kullanıldığıyla gösterir; silme düğmesi birini kaldırır.',
  'help.guide.passkeys.result': 'Oturum açma sayfası passkey’i sunar; şifre yedek olarak kalır.',
  'help.guide.passkeys.tip.1':
    'Bir passkey cihazda ya da şifre yöneticisinde yaşar, bu yüzden cihaz başına bir tane ekleyin.',
  'help.guide.passkeys.tip.2':
    'Passkey’ler HTTPS ister; düz HTTP’li bir örnekte bölüm neden kullanılamadıklarını açıklar.',
  // delete-account
  'help.guide.delete-account.title': 'Hesabınızı silin',
  'help.guide.delete-account.goal': 'Hesabınızı ve yalnızca size ait olan verileri kaldırın.',
  'help.guide.delete-account.step.1': 'Hesap bölümünün en altında Hesabı sil seçeneğine tıklayın ve onaylayın.',
  'help.guide.delete-account.result':
    'Hesabınız, kendi gezileriniz ve Journey’leriniz gider; başkalarıyla paylaştığınız geziler onlarda kalır.',
  'help.guide.delete-account.tip.1': 'Bir örneğin son yöneticisi kendini silemez; önce başkasını yönetici yapın.',
  'help.guide.delete-account.tip.2': 'Geri alma yoktur. Onaylamadan önce saklamak istediklerinizi dışa aktarın.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Yönetim',
  'help.ctx.admin.summary':
    'Herkesin TREK’inin arkasındaki örnek: kimin nasıl oturum açabileceği, nelerin açık olduğu, dosyaların nerede durduğu, sunucunun insanlara nasıl ulaştığı ve nasıl yedeklendiği. Bu sayfayı yalnızca yöneticiler görür; her sekme kenar çubuğunda kendi başına bir ekrandır.',
  'help.ctx.admin.bullet.1':
    'Üstteki dört kart kullanıcıları, seyahatleri, yerleri ve dosyaları sayar; üstlerindeki bir şerit daha yeni bir TREK sürümünü duyurur.',
  'help.ctx.admin.bullet.2':
    'Kullanıcılar ve Kullanıcı Varsayılanları: hesaplar, davet bağlantıları ve yeni bir hesabın başladığı harita ayarları.',
  'help.ctx.admin.bullet.3':
    'Kişiselleştirme, Ayarlar, Eklentiler ve Plugins: paketleme şablonları, kategoriler ve okul tatilleri; oturum açma yöntemleri ve API anahtarları; özellik modülleri; üçüncü taraf pluginler.',
  'help.ctx.admin.bullet.4':
    'Depolama, Bildirimler, MCP Erişimi ve GitHub: yüklemelerin nereye gittiği, örnek genelindeki kanallar, yapay zekâ istemcilerinin belirteçleri ve oturumları ve sürüm geçmişi.',
  'help.ctx.admin.bullet.5':
    'Yedekleme ve Denetim: isteğe bağlı ve zamanlanmış yedekler ve güvenlikle ilgili olayların günlüğü.',
  'help.ctx.admin-users.title': 'Kullanıcılar',
  'help.ctx.admin-users.summary':
    'Bu TREK’teki her hesap, rolü, e-postası ve son oturum açmasıyla, ve kapalı bir örnekte insanların kaydolmasını sağlayan davet bağlantıları.',
  'help.ctx.admin-users.bullet.1':
    'Tablo: kullanıcı adı, e-posta, rol, oluşturulma tarihi, son giriş ve satır başına eylemler. Siz, siz olarak işaretlisiniz.',
  'help.ctx.admin-users.bullet.2': 'Üstteki Kullanıcı Oluştur, teslim edeceğiniz bir şifreyle elle bir hesap ekler.',
  'help.ctx.admin-users.bullet.3':
    'Alttaki Bağlantıları Davet Et: kullanım sınırı, son kullanma tarihi ve isterseniz yeni kullanıcının geldiğinde katılacağı bir seyahat içeren tek seferlik kayıt bağlantıları.',
  'help.ctx.admin-users.bullet.4':
    'En alttaki İzin Ayarları: eylem başına kimin yapabileceği, Herkes, Seyahat üyeleri, Seyahat sahibi ya da Yalnızca yönetici.',
  'help.ctx.admin-defaults.title': 'Kullanıcı Varsayılanları',
  'help.ctx.admin-defaults.summary':
    'Yeni bir hesabın başladığı ayarlar, böylece kimse önce harita sekmesini bulmak zorunda kalmaz: harita sağlayıcısı, stil, jetonlar ve kalite.',
  'help.ctx.admin-defaults.bullet.1':
    'Harita sağlayıcısı, Mapbox stili ve jetonu, CARTO anahtarı ve Mapbox kalitesi, tam bir kullanıcının Ayarlar, Harita altında ayarlayacağı gibi.',
  'help.ctx.admin-defaults.bullet.2':
    'Alan başına yerleşik varsayılana sıfırlama TREK’in kendi seçimini geri getirir; bir kullanıcının kendi ayarı bunlara her zaman üstün gelir.',
  'help.ctx.admin-config.title': 'Kişiselleştirme',
  'help.ctx.admin-config.summary':
    'Örnekteki her seyahatin paylaştıkları: paketleme şablonları, yerler ve koleksiyonlar için kategori kümesi ve Vacay’in yararlandığı okul tatili kataloğu.',
  'help.ctx.admin-config.bullet.1':
    'Paketleme Şablonları: bir seyahatin paketleme listesinin başlangıç alabileceği, adlandırılmış kategori ve öğe listeleri.',
  'help.ctx.admin-config.bullet.2':
    'Kategoriler: yer denetçisinden Koleksiyonlar’a kadar TREK genelinde kullanılan kategorilerin adı, simgesi ve rengi.',
  'help.ctx.admin-config.bullet.3':
    'Okul tatilleri: yerleşik kaynakların kapsamadığı yerler için ülke ve bölge kataloğu.',
  'help.ctx.admin-settings.title': 'Ayarlar',
  'help.ctx.admin-settings.summary':
    'İnsanların nasıl içeri girdiği ve sunucunun neyle konuşabileceği: oturum açma ve kayıt yöntemleri, SSO, passkey’ler, iki faktör politikası, haritalar, yerler ve görseller için API anahtarları, arama ve toplu taşıma sağlayıcıları ve yüklemelerin sahip olabileceği dosya türleri.',
  'help.ctx.admin-settings.bullet.1':
    'Kimlik Doğrulama Yöntemleri: Şifre Girişi, Şifre Kaydı, TOA Girişi, SSO Otomatik Temel Hazırlığı ve İki faktörlü kimlik doğrulama (2FA) gerektir.',
  'help.ctx.admin-settings.bullet.2':
    'Veren, istemci ve ekran adıyla Tek Oturum Açma (OIDC); Relying Party ID (alan adı) ve İzin verilen kaynaklar ile Passkey ile oturum açma.',
  'help.ctx.admin-settings.bullet.3':
    'API Anahtarları: Google Maps, Unsplash ve Amap, her biri Test et ile; Anahtarın ne için kullanıldığı, Google anahtarını ödemek istediğiniz özelliklerle sınırlar.',
  'help.ctx.admin-settings.bullet.4':
    'Yer arama sağlayıcısı ve Toplu taşıma sağlayıcısı aramalara ve rotalara kimin yanıt vereceğini seçer; İzin Verilen Dosya Türleri yüklemeleri sınırlar.',
  'help.ctx.admin-addons.title': 'Eklentiler',
  'help.ctx.admin-addons.summary':
    'TREK’in özellik modülleri, her biri bir anahtarla: Listeler, Maliyetler, Belgeler, Vacay, Atlas, İş birliği, Seyahat, Koleksiyonlar, Yol gezisi, MCP, AirTrail, Dawarich ve yapay zekâ ayrıştırma. Kapalı, gezinme girdisinin, rotaların ve API’nin herkes için gittiği anlamına gelir.',
  'help.ctx.admin-addons.bullet.1':
    'Eklenti başına bir kutucuk, anahtarıyla ve varsa seçenekleri için alt satırlarıyla.',
  'help.ctx.admin-addons.bullet.2':
    'Fotoğraf sağlayıcıları ve belge sağlayıcıları da burada kutucuk olarak görünür, böylece kullanıcılara Immich ya da Synology sunulabilir.',
  'help.ctx.admin-addons.bullet.3': 'Çanta Takibi’nin kutucukların altında kendi anahtarı vardır.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'TREK’in yanında kendi süreçlerinde çalışan üçüncü taraf pluginler, her biri kurulumda istediği izinlerle. Katalogdan kurun, bir paket yükleyin ya da birini geliştirirken bir klasör bağlayın.',
  'help.ctx.admin-plugins.bullet.1':
    'Liste: sürümü, durumu, imzası ve sahip olduğu izinlerle kurulu her plugin; satır başına etkinleştirin, devre dışı bırakın, güncelleyin ya da kaldırın.',
  'help.ctx.admin-plugins.bullet.2':
    'Eklenti yükle bir paket dosyası alır; Yeniden tara geliştirme için bağlanmış bir plugin klasörünü alır.',
  'help.ctx.admin-plugins.bullet.3':
    'Plugin başına İzin verilen ana bilgisayarlar: bir pluginin çağırabileceği adresler, çünkü dışa çıkış varsayılan olarak reddedilir.',
  'help.ctx.admin-storage.title': 'Depolama',
  'help.ctx.admin-storage.summary':
    'Yüklemelerin durduğu yer: yerel disk, bir S3 kovası ya da her ikisine de yazan bir ayna. Her yükleme kategorisi farklı bir arka uca gidebilir ve Sağlık her arka ucun yanıt verip vermediğini söyler.',
  'help.ctx.admin-storage.bullet.1':
    'Arka uçlar: her birinin adı ve türü, Test et, Düzenle ve Kaldır ile; ortam tarafından ayarlanan biri burada salt okunurdur.',
  'help.ctx.admin-storage.bullet.2':
    'Kategoriler: kapaklar, belgeler, seyahat fotoğrafları ve gerisi, her biri bir arka uca atanmış; birini değiştirmek mevcut dosyaları taşımayı önerir.',
  'help.ctx.admin-storage.bullet.3':
    'Sağlık: arka uç başına bir kontrol ve yapılandırmanın sunucunun gördüğü şey olduğunu kanıtlayan tohum dosyası.',
  'help.ctx.admin-notifications.title': 'Bildirimler',
  'help.ctx.admin-notifications.summary':
    'Örneğin kullanıcılarına sunduğu kanallar ve yönetici olarak size ulaşanlar. Kullanıcılar kendi konularını ve URL’lerini Ayarlar altında seçer; neyin var olduğuna siz karar verir ve e-postayı yapılandırırsınız.',
  'help.ctx.admin-notifications.bullet.1':
    'Uygulama içi, E-posta (SMTP), Ntfy, Web kancası ve Web anlık bildirimleri: her biri için bir panel, kanalı kullanıcılara sunan bir anahtar ve ihtiyaç duyduğu sunucu tarafı yapılandırmasıyla.',
  'help.ctx.admin-notifications.bullet.2':
    'Seyahat Hatırlatıcıları: sunucunun bir seyahat başlamadan önce hatırlatıcı gönderip göndermediği.',
  'help.ctx.admin-notifications.bullet.3':
    'Yönetici Ntfy ve Yönetici Webhook: başarısız bir yedek ya da yeni bir sürüm gibi yönetici olaylarının gittiği yer, test ile.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Erişimi',
  'help.ctx.admin-mcp-tokens.summary':
    'Yapay zekâ istemcilerinin bu TREK’e karşı tuttuğu her belirteç ve OAuth oturumu, tüm kullanıcılar genelinde, herhangi birini iptal etme gücüyle.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API Belirteçleri: kimin oluşturduğu, en son ne zaman kullanıldığı ve Sil.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'OAuth Oturumları: istemci, kullanıcı ve verilen kapsamlar, ve İptal et.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK’te yeni olanlar: GitHub’dan sürüm geçmişi, çalıştırdığınız sürüm ve daha yenisinin çıkıp çıkmadığı. Güncellemenin kendisi uygulamanın dışında, ana bilgisayarda olur.',
  'help.ctx.admin-github.bullet.1':
    'Sürüm Geçmişi sürümleri notlarıyla listeler; en yenisi En sonuncu etiketini taşır ve sizin sürümünüz işaretlidir.',
  'help.ctx.admin-github.bullet.2':
    'Daha yeni bir sürüm çıktığında Güncelleme mevcut üst bilgide görünür, Docker ve diğer kurulumlar için nasıl güncelleneceğiyle birlikte.',
  'help.ctx.admin-backup.title': 'Yedekleme',
  'help.ctx.admin-backup.summary':
    'Veritabanının ve yüklemelerin tam yedekleri, elle ya da zamanlanmış olarak alınır, sunucuda tutulur ve tek dosya olarak indirilebilir. Geri yükle birini geri koyar.',
  'help.ctx.admin-backup.bullet.1':
    'Veri Yedekleme: Yedek Oluştur ve İndir, Geri yükle ve silme ile mevcut yedeklerin listesi.',
  'help.ctx.admin-backup.bullet.2':
    'Yedek Yükle başka bir örnekte ya da daha önceki bir günde alınmış bir dosyayı getirir.',
  'help.ctx.admin-backup.bullet.3':
    'Otomatik yedekleme: açık ya da kapalı, aralık, saat ve gün ve kaç tanesinin tutulacağı.',
  'help.ctx.admin-audit.title': 'Denetim',
  'help.ctx.admin-audit.summary':
    'Güvenlikle ilgili ve yönetsel olayların günlüğü: oturum açmalar ve başarısızlıklar, MFA değişiklikleri, kullanıcı ve ayar değişiklikleri, yedekler ve geri yüklemeler. Salt okunur, en yenisi önce.',
  'help.ctx.admin-audit.bullet.1': 'Olay başına bir satır: zaman, kullanıcı, eylem, kaynak, IP ve ayrıntılar.',
  'help.ctx.admin-audit.bullet.2': 'Yenile yeniden yükler; Daha fazlasını yükle daha geriye gider.',
  // create-user
  'help.guide.create-user.title': 'Kullanıcı oluşturun',
  'help.guide.create-user.goal': 'Davet olmadan elle bir hesap ekleyin.',
  'help.guide.create-user.step.1': 'Kullanıcılar sekmesinin üstündeki Kullanıcı Oluştur’a tıklayın.',
  'help.guide.create-user.step.2': 'Kullanıcı adı, E-posta ve bir Şifre girin ve Rol seçin: Kullanıcı ya da Yönetici.',
  'help.guide.create-user.step.3': 'Kullanıcı Oluştur’a tıklayın.',
  'help.guide.create-user.result':
    'Hesap tabloda görünür ve hemen oturum açabilir; şifreyi güvendiğiniz bir kanaldan teslim edin.',
  'help.guide.create-user.tip.1':
    'Kendi şifresini seçmesi gereken biri için davet bağlantısı daha iyi bir giriş yoludur.',
  'help.guide.create-user.tip.2':
    'Yöneticiler bu sayfayı ve denetim günlüğünü görür; geri kalan her şey iki rol için aynıdır.',
  // edit-user
  'help.guide.edit-user.title': 'Bir kullanıcının rolünü ya da şifresini değiştirin',
  'help.guide.edit-user.goal': 'Birini yükseltin, düşürün ya da kaybolan bir şifreden sonra yeniden içeri alın.',
  'help.guide.edit-user.step.1':
    'Kullanıcının satırındaki kaleme tıklayın. Kullanıcıyı Düzenle hesabın bilgileriyle açılır.',
  'help.guide.edit-user.step.2':
    'Rol’ü değiştirin, bir Yeni Şifre belirleyin ya da kişi passkey’lerinin bulunduğu cihazı kaybettiyse Passkey’leri sıfırla’ya tıklayın, ardından Kaydet.',
  'help.guide.edit-user.result':
    'Değişiklik bir sonraki istekte uygulanır; yeni bir şifre bir sonraki oturum açmadan itibaren çalışır.',
  'help.guide.edit-user.tip.1': 'Son yönetici olduğunuz sürece yönetici rolünü kendinizden alamazsınız.',
  'help.guide.edit-user.tip.2':
    'Passkey’leri sıfırlamak şifreyi korur; kişi yeni passkey’leri Ayarlar, Hesap altında ekler.',
  // invite-links
  'help.guide.invite-links.title': 'Birini bağlantıyla davet edin',
  'help.guide.invite-links.goal':
    'Bir kişinin kapalı bir örnekte kaydolmasını ve isterseniz bir seyahate inmesini sağlayın.',
  'help.guide.invite-links.step.1': 'Bağlantıları Davet Et altında Bağlantı Oluştur’a tıklayın.',
  'help.guide.invite-links.step.2':
    'Maks. Kullanım Alanları ve Şu tarihten sonra sona erer: ayarlayın, isteğe bağlı olarak Seyahate ekle (isteğe bağlı) seçin ve Oluştur ve Kopyala’ya tıklayın.',
  'help.guide.invite-links.step.3':
    'Bağlantıyı gönderin. Her satır ne sıklıkla kullanıldığını ve kimin oluşturduğunu gösterir; Bağlantıyı kopyala onu yeniden kopyalar ve tükenmiş ya da süresi dolmuş bağlantılar Kullanılmış ya da Günü geçmiş olarak işaretlenir.',
  'help.guide.invite-links.result':
    'Bağlantıyı açan kişi kendi şifresiyle kaydolur ve bir seyahat seçilmişse ona hemen katılır.',
  'help.guide.invite-links.tip.1': 'Davet bağlantıları, Ayarlar altında Şifre Kaydı kapalıyken bile çalışır.',
  'help.guide.invite-links.tip.2':
    'Tek kullanımlık ve kısa süreli bir bağlantı tek bir kişi için en güvenli varsayılandır.',
  // delete-user
  'help.guide.delete-user.title': 'Kullanıcı silin',
  'help.guide.delete-user.goal': 'Bir hesabı ve yalnızca ona ait olan her şeyi kaldırın.',
  'help.guide.delete-user.step.1':
    'Kullanıcının satırındaki çöp kutusu simgesine tıklayın ve Kullanıcıyı sil’i onaylayın.',
  'help.guide.delete-user.result':
    'Hesap, kendi seyahatleri ve günlükleri gider; başkalarıyla paylaşılan seyahatler kalan üyelerde kalır.',
  'help.guide.delete-user.tip.1': 'Geri alma yoktur. Emin değilseniz önce bir yedek alın.',
  'help.guide.delete-user.tip.2': 'Son yönetici silinemez; önce başkasını yönetici yapın.',
  // permissions
  'help.guide.permissions.title': 'Kimin ne yapabileceğine karar verin',
  'help.guide.permissions.goal': 'Her eylem için bu TREK’te hangi rolün onu yapmasına izin verildiğini belirleyin.',
  'help.guide.permissions.step.1':
    'İzin Ayarları altında eylemi kendi grubunda bulun, örneğin Seyahat Yönetimi altındaki Seyahatleri sil, ve düzeyi seçin: Herkes, Seyahat üyeleri, Seyahat sahibi ya da Yalnızca yönetici. Değiştirilen bir satır özelleştirildi olarak işaretlenir.',
  'help.guide.permissions.step.2':
    'Kaydet’e tıklayın. Varsayılanlara sıfırla her satırı yerleşik düzeye geri döndürür.',
  'help.guide.permissions.result':
    'Kural tüm seyahatlere aynı anda uygulanır; düzeyin altındaki kişilerin düğmeleri ve menüleri kaybolur.',
  'help.guide.permissions.tip.1':
    'Seyahat sahibi, seyahati oluşturan kişi demektir; yöneticiler her zaman her şeyi yapabilir.',
  'help.guide.permissions.tip.2':
    'Bir üyeyi silmek yerine düzeyi düşürün: düzenleyemeyen bir üye yine de okuyabilir ve yorum yapabilir.',
  // default-map
  'help.guide.default-map.title': 'Yeni kullanıcılar için harita varsayılanlarını ayarlayın',
  'help.guide.default-map.goal': 'Her yeni hesaba kişisel jeton olmadan çalışan bir harita verin.',
  'help.guide.default-map.step.1':
    'Harita altında Harita motoru’nu ve Mapbox ya da MapLibre için Harita stili, Paylaşılan Mapbox jetonu ve Yüksek kalite modu’nu; raster bir harita için Harita Şablonu ve Paylaşılan CARTO anahtarı’nı seçin.',
  'help.guide.default-map.step.2':
    'Değiştirdiğiniz her alanın yanında sıfırlama TREK’in kendi seçimini geri getirir. Soldaki Varsayılan Kullanıcı Ayarları aynısını Renk Modu, birimler ve para birimi için yapar.',
  'help.guide.default-map.result':
    'Yeni hesaplar bunlarla başlar; Ayarlar altında kendi haritasını ayarlayan herkes kendininkini korur.',
  'help.guide.default-map.tip.1':
    'Buraya girilen bir jeton kendisininki olmayan herkes tarafından paylaşılır, bu yüzden kotasına dikkat edin.',
  'help.guide.default-map.tip.2': 'Harita sekmesine hiç dokunmamış mevcut hesaplar da bu varsayılanları izler.',
  // packing-templates
  'help.guide.packing-templates.title': 'Paketleme şablonu oluşturun',
  'help.guide.packing-templates.goal':
    'Seyahatlere boş bir liste yerine başlangıç alacakları bir paketleme listesi verin.',
  'help.guide.packing-templates.step.1': 'Yeni Şablon’a tıklayın, bir ad yazın ve onay işaretiyle onaylayın.',
  'help.guide.packing-templates.step.2':
    'Şablonu açın ve Kategori ekle’ye tıklayın; her kategorinin altında + öğe ekler ve bir öğenin yalnızca ada ihtiyacı vardır.',
  'help.guide.packing-templates.step.3':
    'Her şey siz ilerledikçe kaydedilir. Kalem bir şablonu, kategoriyi ya da öğeyi yeniden adlandırır, çöp kutusu siler.',
  'help.guide.packing-templates.result':
    'Şablon her seyahatin paketleme listesinde sunulur; uygulamak öğeleri kopyalar, böylece bir seyahat onları serbestçe değiştirebilir.',
  'help.guide.packing-templates.tip.1':
    'Seyahat türü başına bir şablon, plaj, şehir, yürüyüş, tek bir dev listeden iyidir.',
  'help.guide.packing-templates.tip.2': 'Bir şablonu silmek onu zaten uygulamış seyahatlere dokunmaz.',
  // categories
  'help.guide.categories.title': 'Kategori kümesini yönetin',
  'help.guide.categories.goal':
    'Yerlerin ve koleksiyonların hangi kategorileri taşıyabileceğine ve nasıl görüneceklerine karar verin.',
  'help.guide.categories.step.1':
    'Yeni Kategori’ye tıklayın, bir ad verin, bir simge ve renk seçin; Önizleme sonucu gösterir. Oluştur’a tıklayın.',
  'help.guide.categories.step.2':
    'Düzenlemek ya da silmek için listede bir kategorinin üzerine gelin. Silme onay ister.',
  'help.guide.categories.result':
    'Küme her yerde aynı anda geçerli olur: yer denetçisi, harita iğneleri, Koleksiyonlar ve filtreler.',
  'help.guide.categories.tip.1':
    'Yerler kategori kimliğini korur, bu yüzden bir kategoriyi yeniden adlandırmak onu her yerde yeniden adlandırır.',
  'help.guide.categories.tip.2': 'Silinen bir kategori yerlerini kategorisiz bırakır; önemliyse önce yeniden atayın.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Okul tatillerini elle yönetin',
  'help.guide.school-holiday-catalog.goal':
    'Yerleşik tatil kaynaklarının kapsamadığı bir ülkeyi ya da bölgeyi kapsayın.',
  'help.guide.school-holiday-catalog.step.1':
    'Okul tatilleri altında Ülke ekle’ye tıklayın, Ülke ve Ülke kodu (ör. US) girin ve Kaydet; ardından farklılık gösteren her parçası için Bölge ekle.',
  'help.guide.school-holiday-catalog.step.2':
    'Bölge veya okul bölgesi’ni açmak için bir bölgeye tıklayın: Tatil dönemi ekle, her birine Tatil adı, Başlangıç tarihi ve Bitiş tarihi verin ve Kaydet. Çöp kutusu bir dönemi, bir bölgeyi ya da bölgesi kalmadığında bir ülkeyi kaldırır.',
  'help.guide.school-holiday-catalog.result':
    'Kullanıcılar ülkeyi ve bölgeyi Vacay’deki Ayarlar altında bulur ve dönemleri yıl ızgaralarında görür.',
  'help.guide.school-holiday-catalog.tip.1':
    'Yerleşik kaynaklardan gelen bölgeler burada düzenlenemez; bir tarih yanlışsa yanına elle bir bölge ekleyin.',
  // auth-methods
  'help.guide.auth-methods.title': 'İnsanların nasıl oturum açacağına karar verin',
  'help.guide.auth-methods.goal': 'Şifreyle oturum açmayı, SSO’yu ve kaydı açın ya da kapatın ve 2FA gerektirin.',
  'help.guide.auth-methods.step.1':
    'Kimlik Doğrulama Yöntemleri altında Şifre Girişi ve Şifre Kaydı’nı açın ya da kapatın. Kayıt kapalıysa yeni hesaplar yalnızca davet bağlantıları, SSO ya da elle açılır.',
  'help.guide.auth-methods.step.2':
    'TOA Girişi ve SSO Otomatik Temel Hazırlığı aşağıda yapılandırılmış Tek Oturum Açma (OIDC) gerektirir; otomatik hazırlık biri SSO ile ilk kez oturum açtığında bir hesap oluşturur.',
  'help.guide.auth-methods.step.3':
    'İki faktörlü kimlik doğrulama (2FA) gerektir, şifreyle yapılan her oturum açmanın bir sonraki girişte bir doğrulayıcı kurmasını sağlar. Passkey ile oturum açma, Relying Party ID (alan adı) ve İzin verilen kaynaklar alanlarını, yani TREK’inize ulaşılan adresleri gerektirir.',
  'help.guide.auth-methods.result': 'Oturum açma sayfası tam olarak açık bıraktığınız yöntemleri sunar.',
  'help.guide.auth-methods.tip.1':
    'Kendinizi dışarıda bırakmadan önce bir uyarı görünür: yöneticiler için en az bir giriş yolu açık kalır.',
  'help.guide.auth-methods.tip.2': 'Ortam değişkenleriyle ayarlanan değerler burada salt okunur görünür.',
  // oidc
  'help.guide.oidc.title': 'Tek oturum açmayı bağlayın',
  'help.guide.oidc.goal': 'İnsanların kimlik sağlayıcınızla oturum açmasını sağlayın.',
  'help.guide.oidc.step.1':
    "Tek Oturum Açma (OIDC) altında düğme için Ekran Adı’nı ve sağlayıcınızdan Veren URL'si, Client ID ve Client Secret’ı girin, ardından Kaydet.",
  'help.guide.oidc.step.2': 'Kimlik Doğrulama Yöntemleri altında TOA Girişi’ni açın.',
  'help.guide.oidc.result':
    'Oturum açma sayfası SSO düğmesini gösterir; SSO Otomatik Temel Hazırlığı açıkken ilk kez gelen kullanıcılar otomatik olarak bir hesap alır.',
  'help.guide.oidc.tip.1':
    'Sağlayıcınızın ihtiyaç duyduğu yönlendirme URI’si, TREK’inizin adresi artı belgelerdeki OIDC geri çağırma yoludur.',
  'help.guide.oidc.tip.2':
    'Talep eşleme hangi SSO gruplarının yönetici olacağına karar verir; belgelerdeki OIDC sayfasına bakın.',
  // instance-keys
  'help.guide.instance-keys.title': 'API anahtarlarını girin',
  'help.guide.instance-keys.goal': 'Google yer aramasını, Unsplash kapaklarını ve Amap’i tüm örnek için açın.',
  'help.guide.instance-keys.step.1':
    'API Anahtarları altında Google Haritalar API Anahtarı’nı yapıştırın ve Test et’e tıklayın; alan anahtarın yanıt verip vermediğini söyler.',
  'help.guide.instance-keys.step.2':
    'Anahtarın ne için kullanıldığı altında yalnızca o anahtara faturalanmasını istediğiniz özellikleri açın: Otomatik Tamamlamayı Yerleştir, Yer Detayları, Fotoğrafları Yerleştir, Yer zenginleştirme, Yer arama günlüğü.',
  'help.guide.instance-keys.step.3':
    'Unsplash API Anahtarı kapak aramasını; Amap (高德地图) API Anahtarı Çin’de yer aramasını çalıştırır. Her birini aynı şekilde test edin.',
  'help.guide.instance-keys.result':
    'Kullanıcılar özellikleri kendi anahtarları olmadan alır; Google anahtarı olmadan TREK ücretsiz OpenStreetMap yığını ve TREK Places API üzerinden arar.',
  'help.guide.instance-keys.tip.1':
    'Bir kullanıcının Ayarlar altındaki kişisel anahtarı, o kullanıcı için örnek anahtarına üstün gelir.',
  'help.guide.instance-keys.tip.2':
    'Anahtarlar ortam değişkenlerinden de gelebilir; bunlar burada salt okunur görünür.',
  // places-transit
  'help.guide.places-transit.title': 'Arama ve toplu taşıma sağlayıcılarını seçin',
  'help.guide.places-transit.goal': 'Yer aramalarına ve toplu taşıma rotalarına kimin yanıt vereceğine karar verin.',
  'help.guide.places-transit.step.1':
    'Yer arama sağlayıcısı altında Otomatik, Google Places, Amap (高德地图) ya da OpenStreetMap seçin. Otomatik var olan en iyi anahtarı kullanır.',
  'help.guide.places-transit.step.2':
    'Toplu taşıma sağlayıcısı altında dünya çapında ve anahtarsız Transitous (ücretsiz) ya da Google anahtarı gerektiren Google seçin.',
  'help.guide.places-transit.result': 'TREK’teki her arama kutusu ve her toplu taşıma rotası bu seçimi izler.',
  'help.guide.places-transit.tip.1':
    'Anahtarı olmayan bir sağlayıcı burada bir uyarı gösterir ve OpenStreetMap’e geri düşer.',
  'help.guide.places-transit.tip.2': 'Google toplu taşıma rotaları istek başına faturalanır; Transitous faturalanmaz.',
  // file-types
  'help.guide.file-types.title': 'Dosya türlerini sınırlayın',
  'help.guide.file-types.goal': 'Yüklemelerin hangi dosya uzantılarına sahip olabileceğine karar verin.',
  'help.guide.file-types.step.1':
    'İzin Verilen Dosya Türleri altında virgülle ayrılmış uzantı listesini düzenleyin ve kaydedin.',
  'help.guide.file-types.result':
    'Başka türde yüklemeler belgelerde, günlükte ve kapaklarda net bir mesajla reddedilir.',
  'help.guide.file-types.tip.1':
    'Görsel türlerini listede tutun; kapaklar ve seyahat fotoğrafları aynı kontrolden geçer.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Bir eklentiyi açın ya da kapatın',
  'help.guide.toggle-addon.goal': 'Bir özellik modülünü herkese sunun ya da geri alın.',
  'help.guide.toggle-addon.step.1':
    'Eklentinin kutucuğundaki anahtarı çevirin. Gezinme girdisi herkes için aynı anda görünür ya da kaybolur.',
  'help.guide.toggle-addon.step.2':
    'Bazı kutucuklar seçenekleri için alt satırlar taşır, Listeler altındaki Çanta Takibi ya da Seyahat altındaki fotoğraf sağlayıcıları gibi; yalnızca eklenti açıkken görünürler.',
  'help.guide.toggle-addon.result': 'Kapatılan bir eklentinin verileri korunur; yeniden açmak onları yeniden gösterir.',
  'help.guide.toggle-addon.tip.1': 'MCP kapalıyken uç nokta ve ona bağlı Entegrasyonlar bölümleri kaldırılır.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas ve Seyahat kullanıcıların en çok istediği eklentilerdir; Belgeler yüklemeler için depolama gerektirir.',
  // install-plugin
  'help.guide.install-plugin.title': 'Plugin kurun',
  'help.guide.install-plugin.goal': 'Üçüncü taraf bir plugin ekleyin ve ona tam olarak istediği izinleri verin.',
  'help.guide.install-plugin.step.1':
    'Keşfet’i açın, bir plugin seçin ve Yükle’ye tıklayın; ya da Eklenti yükle’ye tıklayın ve bir .zip ya da .tar.gz paketi seçin.',
  'help.guide.install-plugin.step.2':
    'Yüklü altına dönüp satırı okuyun: pluginin neyi okuyup yazabileceği, çağırdığı ana bilgisayarlar ve imzalı olup olmadığı. Eklentiyi etkinleştir’i açın.',
  'help.guide.install-plugin.step.3':
    'Satırın menüsü Yeniden başlat, Hata günlüğünü görüntüle, İzin verilen ana bilgisayarlar ve Sürüm değiştir… sunar; Sil onu kaldırır. Daha yeni bir sürüm olduğunda satırda bir güncelleme sunulur ve yeni haklar isteyen biri siz onaylayana kadar kapalı kalır.',
  'help.guide.install-plugin.result':
    'Plugin kendi sürecinde çalışır; eklediği şeyler, bileşenler, harita katmanları, araçlar, pluginin bildirdiği yerde görünür.',
  'help.guide.install-plugin.tip.1': 'Yeniden tara, geliştirme için bağlanmış bir plugin klasörünü paket olmadan alır.',
  'help.guide.install-plugin.tip.2': 'İmzasız bir plugin öyle işaretlenir; yalnızca kaynağına güvendiğinizde kurun.',
  // storage-backends
  'help.guide.storage-backends.title': 'Yüklemeleri S3’e ya da bir aynaya taşıyın',
  'help.guide.storage-backends.goal': 'Dosyaları nesne depolamada ya da hem diskte hem kovada tutun.',
  'help.guide.storage-backends.step.1':
    'Arka uçlar altında Arka uç ekle’ye tıklayın, bir Ad verin, Tür seçin, Yerel, S3 ya da Ayna, alanları doldurun ve Uygula. Test et bağlantıyı kontrol eder, Değişiklikleri kaydet yazar.',
  'help.guide.storage-backends.step.2':
    'Kategoriler altında her yükleme kategorisini bir arka uca atayın. Birini değiştirmek Mevcut nesneleri taşı mı yoksa Yalnızca yeni yazmaları yönlendir mi diye sorar.',
  'help.guide.storage-backends.step.3':
    'Üstteki Sağlık her arka ucu kontrol eder; kırmızı bir girdi neyin başarısız olduğunu adlandırır.',
  'help.guide.storage-backends.result': 'Yeni yüklemeler atanan arka uca gider; taşınan dosyalar oradan sunulur.',
  'help.guide.storage-backends.tip.1':
    'Ortam değişkenleriyle yapılandırılmış bir arka uç gösterilir ama burada düzenlenemez.',
  'help.guide.storage-backends.tip.2':
    'Bir ayna her iki hedefe yazar ve ilkinden okur; kesinti olmadan geçiş yapmak için kullanın.',
  // channels-instance
  'help.guide.channels-instance.title': 'Bildirim kanallarını yapılandırın',
  'help.guide.channels-instance.goal': 'Kullanıcıların hangi kanalları seçebileceğine karar verin ve e-postayı kurun.',
  'help.guide.channels-instance.step.1':
    'E-posta (SMTP) altında SMTP Host, SMTP Port, SMTP User, SMTP Password ve From Address girin; Test e-postası gönder size bir posta gönderir.',
  'help.guide.channels-instance.step.2':
    'Sunmak için Web anlık bildirimleri, Ntfy ve Web kancası’nı açın; kullanıcılar sonra Ayarlar, Bildirimler altında anlık bildirimleri cihaz başına açar ya da kendi konularını veya URL’lerini girer.',
  'help.guide.channels-instance.step.3':
    'Seyahat Hatırlatıcıları bir seyahat başlamadan önceki hatırlatıcıyı açıp kapatır; Uygulama içi her zaman açıktır ve burada yalnızca açıklanır.',
  'help.guide.channels-instance.result': 'Her kullanıcının Bildirimler sekmesi açtığınız kanalları gösterir.',
  'help.guide.channels-instance.tip.1':
    'Buraya girilen varsayılan ntfy sunucusu kullanıcılar için önceden doldurulur; yine de kendilerininkini belirtebilirler.',
  'help.guide.channels-instance.tip.2':
    'Plugin kanalları, o yeteneğe sahip bir plugin etkin olduğunda kendiliğinden görünür.',
  // admin-channels
  'help.guide.admin-channels.title': 'Yönetici olaylarını telefonunuza alın',
  'help.guide.admin-channels.goal':
    'Başarısız yedeklerden, yeni sürümlerden ve diğer örnek olaylarından haberdar olun.',
  'help.guide.admin-channels.step.1':
    'Yönetici Ntfy altında bir konu ve gerekirse sunucu ve jeton girin; Yönetici Webhook altında bir URL.',
  'help.guide.admin-channels.step.2':
    'Bir mesajın geldiğini görmek için Test ntfy gönder ya da Test webhook gönder’e tıklayın.',
  'help.guide.admin-channels.result': 'Yönetici olayları her yöneticinin uygulama içi ziline ek olarak oraya gider.',
  'help.guide.admin-channels.tip.1':
    'Yönetici konusunu kişisel konunuzdan ayrı tutun ki bir kesinti seyahat sohbetinde boğulmasın.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Yapay zekâ erişimini iptal edin',
  'help.guide.mcp-tokens-admin.goal':
    'Bir yapay zekâ istemcisinin tuttuğu her belirteci ve oturumu herhangi bir kullanıcı için görün ve kesin.',
  'help.guide.mcp-tokens-admin.step.1':
    'API Belirteçleri altında belirteci kullanıcı ve ada göre bulun; çöp kutusu onu siler ve istemci hemen durur.',
  'help.guide.mcp-tokens-admin.step.2':
    'OAuth Oturumları altında tarayıcı tabanlı istemciler için aynısı: istemci, kullanıcı ve tarih, ve çöp kutusu oturumu iptal eder.',
  'help.guide.mcp-tokens-admin.result':
    'İstemcinin kullanıcısı tarafından yeniden bağlanması gerekir; başka hiçbir şey değişmez.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Kapsamlar bir istemcinin ne yapabildiğini söyler; salt okunur bir kapsamı bırakmak zararsızdır.',
  'help.guide.mcp-tokens-admin.tip.2': 'MCP eklentisini kapatmak her şeyi aynı anda iptal eder.',
  // release-history
  'help.guide.release-history.title': 'Yeni sürüm olup olmadığına bakın',
  'help.guide.release-history.goal': 'TREK’inizin güncel olup olmadığını ve bir sonraki sürümün ne getirdiğini bilin.',
  'help.guide.release-history.step.1':
    "Daha yeni bir sürüm olduğunda Güncelleme mevcut yönetim sayfasının üstünde görünür; GitHub'da görüntüle onu açar ve Nasıl Güncellenir? Docker ve diğer kurulumlar için güncellemeyi açıklar.",
  'help.guide.release-history.step.2':
    'Sürüm Geçmişi her sürümü notlarıyla listeler; Ayrıntıları göster onları genişletir, en yenisi En sonuncu etiketini taşır ve Daha fazlasını yükle daha geriye gider.',
  'help.guide.release-history.result':
    'Güncelleme ana bilgisayarda olur, yeni imajı çekerek ya da yeni etiketi derleyerek; veri dizini kalır.',
  'help.guide.release-history.tip.1': 'Güncellemeden önce bir yedek alın; Yedekleme sekmesi hemen yanda.',
  'help.guide.release-history.tip.2':
    'Ön sürümler gösterilir ama siz birini çalıştırmadıkça güncelleme olarak duyurulmaz.',
  // create-backup
  'help.guide.create-backup.title': 'Yedek alın ve geri yükleyin',
  'help.guide.create-backup.goal':
    'Tüm örneğin anlık görüntüsünü alın, bir kopyasını başka yerde tutun ve geri koyabilin.',
  'help.guide.create-backup.step.1':
    'Veri Yedekleme altında Yedek Oluştur’a tıklayın. Veritabanını ve yüklemeleri sunucuda tek bir dosyaya paketler.',
  'help.guide.create-backup.step.2':
    'İndir bir kopyayı makinenin dışında tutar; çöp kutusu yer açmak için eskileri siler.',
  'help.guide.create-backup.step.3':
    'Bir yedekteki Geri yükle ya da bir dosyayla Yedek Yükle, Yedek geri yüklensin mi? bir kez sorduktan sonra mevcut verileri değiştirir.',
  'help.guide.create-backup.result':
    'Bir geri yükleme kullanıcıları, seyahatleri, dosyaları ve ayarları o yedek anındaki haliyle geri getirir; herkesin oturumu kapatılır.',
  'help.guide.create-backup.tip.1': 'Geri yükleme buradaki geri alınamayan tek eylemdir. Önce taze bir yedek alın.',
  'help.guide.create-backup.tip.2':
    'Yedekler veri dizininde durur; onları yedek yapan şey başka bir makinedeki kopyadır.',
  // auto-backup
  'help.guide.auto-backup.title': 'Yedekleri zamanlayın',
  'help.guide.auto-backup.goal': 'Sunucunun kendini yedeklemesini ve yalnızca son birkaçını tutmasını sağlayın.',
  'help.guide.auto-backup.step.1':
    'Otomatik yedekleme altında Otomatik yedeklemeyi etkinleştir’i açın ve Aralık, Çalışma saati ve haftalık ya da aylık için Haftanın günü ya da Ayın günü’nü seçin.',
  'help.guide.auto-backup.step.2':
    'Eski yedekleri şu süreden sonra sil bir yedeğin ne kadar tutulacağını belirler; yenisi alındığında eskileri gider.',
  'help.guide.auto-backup.result': 'Yedekler listede zamanında görünür; bir başarısızlık yönetici kanallarına ulaşır.',
  'help.guide.auto-backup.tip.1': 'Saatler, Denetim sekmesinde gösterilen sunucu saat dilimini izler.',
  'help.guide.auto-backup.tip.2': 'Sunucudaki depolama sınırlıdır; üç ila beş tane tutmak genellikle yeterlidir.',
  // audit-log
  'help.guide.audit-log.title': 'Denetim günlüğünü okuyun',
  'help.guide.audit-log.goal': 'Kimin neyi ne zaman yaptığını öğrenin.',
  'help.guide.audit-log.step.1':
    'Satırları okuyun: zaman, kullanıcı, eylem, kaynak, IP ve ayrıntılar, en yenisi önce. Eylemler olana göre adlandırılır, bir giriş hatası, bir MFA değişikliği ya da bir geri yükleme gibi.',
  'help.guide.audit-log.step.2': 'Yenile en üstü yeniden yükler; Daha fazlasını yükle daha geriye gider.',
  'help.guide.audit-log.result': 'Bir şeyin neden değiştiğini soran herkese verebileceğiniz bir iz.',
  'help.guide.audit-log.tip.1': 'Saatler, tablonun üstünde adı geçen sunucu saat diliminde gösterilir.',
  'help.guide.audit-log.tip.2':
    'Günlük yalnızca eklemelidir; buradaki hiçbir şey uygulamadan düzenlenemez ya da silinemez.',
  // document-providers
  'help.guide.document-providers.title': 'Bir belge deposu sunun',
  'help.guide.document-providers.goal': 'Bir gezinin belgelerini hangi depolarla eşit tutabileceğine karar verin.',
  'help.guide.document-providers.step.1':
    'Belgeler kutucuğu depoları rafında satırlar olarak taşır: Paperless-ngx, Papra, Nextcloud, OpenCloud ve Synology Drive. Beşi de kapalı başlar ve raf yalnızca Belgeler’in kendisi açıkken oradadır.',
  'help.guide.document-providers.step.2':
    'Nextcloud satırındaki anahtarı açın. Mesajda Eklenti güncellendi yazar ve bundan sonra gezi sahipleri gezilerinin Dosyalar sekmesinde Belge eşitleme’yi, Sağlayıcı bağla altında da Nextcloud’u bulur.',
  'help.guide.document-providers.result':
    'Depo bu TREK’in her gezisinde sunulur; bir gezi sahibi bağlayana kadar hiçbir şey bağlı değildir.',
  'help.guide.document-providers.tip.1':
    'Burada yalnızca bir deponun sunulup sunulamayacağına karar verilir. Adres ve kimlik bilgileri bir geziye aittir ve gezinin sahibi tarafından Dosyalar sekmesinde girilir, asla yönetici panelinde değil.',
  'help.guide.document-providers.tip.2':
    'Belgeler’i kapatmak her depoyu onunla birlikte kapatır ve Belgeler kapalıyken bir depo açılamaz: sunucu Enable the Documents addon first yanıtını verir. Kendi ağınızdaki bir depo ayrıca sunucuda ALLOW_INTERNAL_NETWORK=true ister.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Seyahat',
  'help.ctx.trip.summary':
    'Tek bir seyahat, hepsi bir arada: günleri, haritası ve yerleriyle plan, ayrıca ulaşım, rezervasyonlar, listeler, maliyetler, dosyalar ve iş birliği sekmeleri. Bunların her birinin bu ekranın altında kendi yardım ekranı var.',
  'help.ctx.trip.bullet.1':
    'Sekme çubuğu: Planı, Ulaşım, Rezervasyonlar, Listeler, Maliyetler, Dosyalar ve İş birliği. TREK’inizde hangi sekmelerin bulunacağına eklentiler ve plugin’ler karar verir.',
  'help.ctx.trip.bullet.2':
    'Planı üç sütundur: solda günler, ortada harita, sağda yerler. Rezervasyonlar ve ulaşım planın içinde yaşar, durakta ve duraklar arasında; sekmeler onları listeler.',
  'help.ctx.trip.bullet.3':
    'Sağ üstteki Paylaş seyahatin insanlarını açar: üyeler, misafirler, davet bağlantısı ve salt okunur genel bağlantı.',
  'help.ctx.trip.bullet.4':
    'Başlık, tarihler, kapak ve para birimi Seyahatlerim’den, seyahat kartındaki kalemle düzenlenir.',
  'help.ctx.trip.bullet.5':
    'Bir sütunun iç kenarındaki ok uçları onu katlar ve yeri harita alır; sütunun yanındaki ince ayırıcı genişliğini değiştirir.',
  'help.ctx.trip.bullet.6': 'Günlerin araç çubuğundaki geri alma oku plandaki son değişikliği geri alır.',
  // add-member
  'help.guide.add-member.title': 'Üye ekleyin',
  'help.guide.add-member.goal': 'TREK hesabı olan birine bu seyahate erişim verin.',
  'help.guide.add-member.step.1': 'Sağ üstteki Paylaş düğmesine tıklayın.',
  'help.guide.add-member.step.2': 'Kullanıcı davet et altında kişiyi listeden seçin ve Davet et düğmesine tıklayın.',
  'help.guide.add-member.step.3':
    'Kişi artık Erişim altında görünür. Taç sahibi işaretler; satırın sonundaki simge erişimi yeniden kaldırır.',
  'help.guide.add-member.result':
    'Üye seyahati sizin gibi görür ve düzenler, yöneticinin İzin Ayarları altında belirlediği seviyeler dahilinde.',
  'help.guide.add-member.tip.1':
    'Listede olmayan birinin henüz TREK hesabı yoktur: onu misafir olarak ekleyin ya da bir davet bağlantısıyla kaydolmasına izin verin.',
  'help.guide.add-member.tip.2':
    'Erişim yanındaki sayı seyahatteki kişileri sayar; misafirler aşağıda ayrıca listelenir.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Bağlantıyla davet edin',
  'help.guide.trip-invite-link.goal': 'İnsanların seyahate kendilerinin katılmasına izin verin.',
  'help.guide.trip-invite-link.step.1':
    'Paylaş düğmesine tıklayın, sonra Seyahat davet bağlantısı altında Davet bağlantısı oluştur düğmesine tıklayın.',
  'help.guide.trip-invite-link.step.2':
    'Kopyala düğmesine tıklayın ve bağlantıyı gönderin. Onu açan TREK hesaplı herkes üye olarak katılır.',
  'help.guide.trip-invite-link.step.3':
    'Yeniden oluştur bağlantıyı değiştirir ve eskisini işe yaramaz hale getirir; Devre dışı bırak onu kapatır.',
  'help.guide.trip-invite-link.result': 'Bağlantıyı kim açarsa seyahattedir ve Erişim altında görünür.',
  'help.guide.trip-invite-link.tip.1':
    'Hesabı olmayan biri onu kullanamaz. Yönetici, kayıt bağlantılarını Yönetim, Kullanıcılar altında dağıtır ve birini bu seyahate bağlayabilir.',
  'help.guide.trip-invite-link.tip.2':
    'Bir bağlantı yanlış sohbete gittiyse Yeniden oluştur kullanın: eskisi hemen çalışmayı bırakır.',
  // add-guest
  'help.guide.add-guest.title': 'Hesabı olmayan bir misafir ekleyin',
  'help.guide.add-guest.goal': 'TREK kullanmayan birini de hesaba katın.',
  'help.guide.add-guest.step.1': 'Paylaş düğmesine tıklayın ve Misafirler bölümüne kaydırın.',
  'help.guide.add-guest.step.2': 'Adı Misafir adı alanına yazın ve Misafir ekle düğmesine tıklayın.',
  'help.guide.add-guest.result': 'Misafir maliyetlere, bavul öğelerine ve görevlere atanabilir ama oturum açamaz.',
  'help.guide.add-guest.tip.1':
    'Kalem bir misafiri yeniden adlandırır; satırın sonundaki simge onu payları ve atamalarıyla birlikte kaldırır.',
  'help.guide.add-guest.tip.2': 'Kişi sonradan hesap açarsa onu üye olarak davet edin ve misafiri kaldırın.',
  // public-link
  'help.guide.public-link.title': 'Salt okunur bir bağlantı yayınlayın',
  'help.guide.public-link.goal': 'Seyahati düzenlememesi gereken kişilere gösterin.',
  'help.guide.public-link.step.1':
    'Paylaş düğmesine tıklayın; sağda, Genel Bağlantı altında bağlantının neyi gösterebileceğini işaretleyin. Harita ve Plan her zaman açıktır; Rezervasyonlar, Ambalaj, Maliyetler ve Sohbet sizin seçiminizdir.',
  'help.guide.public-link.step.2': 'Bağlantı oluştur düğmesine, sonra Kopyala düğmesine tıklayın.',
  'help.guide.public-link.step.3':
    'İşaretler bağlantı var olduğu sürece değiştirilebilir; Bağlantıyı sil onu durdurur.',
  'help.guide.public-link.result':
    'Bağlantısı olan herkes seçilen bölümleri oturum açmadan görür ve hiçbir şeyi değiştiremez.',
  'help.guide.public-link.tip.1':
    'Bağlantı hiçbir yerde listelenmez; elinde olan herkes açabilir, bu yüzden ona bir şifre gibi davranın.',
  'help.guide.public-link.tip.2': 'Düzenleme hakları için kişiyi bunun yerine üye olarak ekleyin.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Seyahati devredin ya da seyahatten ayrılın',
  'help.guide.transfer-ownership.goal': 'Başkasını sahip yapın ya da sizin olmayan bir seyahatten çıkın.',
  'help.guide.transfer-ownership.step.1':
    'Paylaş düğmesine tıklayın. Erişim altında bir üyenin satırındaki taç o kişiyi sahip yapar; soruyu onaylayın.',
  'help.guide.transfer-ownership.step.2':
    'Kendi satırınızdaki Seyahatten ayrıl sizi seyahatten çıkarır; sahipseniz önce devredin.',
  'help.guide.transfer-ownership.result':
    'Yeni sahip üyeleri yönetir ve seyahati silebilir; siz sıradan bir üye olarak kalırsınız.',
  'help.guide.transfer-ownership.tip.1':
    'Devredilene kadar sahip, seyahati oluşturan kişidir; seyahati silmek yalnızca ona aittir.',
  'help.guide.transfer-ownership.tip.2':
    'Başka bir satırdaki Erişimi kaldır aynı düğmenin tersidir: sahip bir üyeyi çıkarır.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Haritaya yer açın',
  'help.guide.collapse-columns.goal': 'Bir sütunu katlayın ya da ona daha fazla genişlik verin.',
  'help.guide.collapse-columns.step.1':
    'Günler sütununun iç kenarındaki ok ucuna tıklayarak onu daraltın; yeri harita alır. Yerler sütununda da aynı ok ucu vardır.',
  'help.guide.collapse-columns.step.2': 'Sütunu geri getirmek için ok ucuna yeniden tıklayın.',
  'help.guide.collapse-columns.step.3':
    'Sütunun genişliğini değiştirmek için sütunla harita arasındaki ince ayırıcıyı sürükleyin.',
  'help.guide.collapse-columns.result':
    'Genişlikler hatırlanır; sütunlar bir sonraki ziyarette açık olarak geri gelir.',
  'help.guide.collapse-columns.tip.1': 'Yalnızca harita görünümü için iki sütun da aynı anda katlanabilir.',
  'help.guide.collapse-columns.tip.2': 'Telefonda sütun yoktur: Planı ve Yerler haritanın altındaki iki düğmedir.',
  // undo-change
  'help.guide.undo-change.title': 'Son değişikliği geri alın',
  'help.guide.undo-change.goal': 'Planda az önce yaptığınızı geri alın.',
  'help.guide.undo-change.step.1':
    'Günlerin üstündeki araç çubuğunda geri alma okuna tıklayın; ipucu, geri alacağı değişikliği adlandırır.',
  'help.guide.undo-change.result': 'Plan eski haline döner ve ok bir sonraki değişikliğe kadar grileşir.',
  'help.guide.undo-change.tip.1':
    'Geri alma planı kapsar: yerleri atama, çıkarma, yeniden sıralama ve taşıma, rota optimizasyonu, yer silme, kategori değişiklikleri ve içe aktarmalar.',
  'help.guide.undo-change.tip.2':
    'Tek adım derinliğindedir: yalnızca en son değişiklik geri alınabilir ve yeni bir değişiklik onun yerini alır.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Yerler',
  'help.ctx.trip-places.summary':
    'Planın sağ sütunu: gezinin her yeri, planlanmış olsun ya da olmasın, arama ve filtrelerle birlikte, ve yerleri içeri getirme yolları, elle, bir dosyadan ya da paylaşılan bir listeden.',
  'help.ctx.trip-places.bullet.1':
    'Üstteki Yer/etkinlik Ekle, yazdığınız ya da aradığınız bir yer için formu açar. Bir gün açıkken düğmede Yeni yer yazar ve yanındaki Güne, yeri doğrudan o günde oluşturur.',
  'help.ctx.trip-places.bullet.2':
    'Dosyayı içe aktar .gpx, .kml ve .kmz dosyalarını alır; Liste İçe Aktarma paylaşılan bir Google Maps ya da Naver Maps listesini alır. Bir dosya sütunun üzerine de bırakılabilir.',
  'help.ctx.trip-places.bullet.3':
    'Açılır liste Tüm, Planlanmamış, Planlanmış ve bir parça içe aktarıldığında Parçalar arasında geçiş yapar; altında arama, kategori filtresi ve en düşük puan için yıldız durur.',
  'help.ctx.trip-places.bullet.4':
    "Bir satır resmi, adı ve açıklamayı ya da adresi gösterir. Yerin ayrıntıları için satıra tıklayın, bir güne sürükleyin ya da Düzenle, + Gün, Web Sitesini Aç, Google Haritalar'da aç, Koleksiyona kaydet ve Sil için sağ tıklayın.",
  'help.ctx.trip-places.bullet.5':
    'Bir gün açıkken, planlanmamış bir satırın sonundaki + yeri o güne koyar ve Planlanmış yalnızca o günü listeler; yeniden genişletmek için yanında Tüm yolculuğu göster bulunur.',
  'help.ctx.trip-places.bullet.6':
    'Filtre satırının sağ ucundaki onay işareti bir seçim başlatır: birkaç satır birden yeni bir kategori alır, bir koleksiyona gider ya da silinir.',
  // create-place
  'help.guide.create-place.title': 'Bir yer oluşturun',
  'help.guide.create-place.goal':
    'Bir yeri ya da etkinliği elle ekleyin, planın onun hakkında bilmesi gereken her şeyle.',
  'help.guide.create-place.step.1':
    'Yerler sütununun üstündeki Yer/etkinlik Ekle düğmesine tıklayın (bir gün açıkken Yeni yer). Form açılır.',
  'help.guide.create-place.step.2':
    "Yeri üstteki Yerleri ara... alanına yazın ve bir sonuç seçin. İsim, Adres, Enlem, Boylam ve Web sitesi dolar, soldaki Yer ayrıntıları ise onun için resimleri, çalışma saatlerini ve bir açıklamayı gösterir. Google anahtarı olan bir TREK’te, listenin altında Doğru yer değil mi? Bunun yerine Google'da ara satırı durur ve aynı aramayı Google üzerinden çalıştırır.",
  'help.guide.create-place.step.3':
    'Yer ayrıntıları içinde, Bir görsel seç altındaki bir resme tıklamak onu yerin görseli yapar; Bu metni kullan açıklamayı forma aktarır.',
  'help.guide.create-place.step.4':
    'Alanları kontrol edin: İsim zorunludur; Tanım ve Notlar sizindir; Adres, Enlem ve Boylam aramadan gelir ya da yazılır; Kategori gezinin kategorilerinden birini seçer ve yanındaki + anında yenisini oluşturur; Web sitesi bağlantıyı alır.',
  'help.guide.create-place.step.5':
    'Ekle düğmesine tıklayın. Aynı adlı bir yer gezide zaten varsa form bunu söyler ve düğme Yine de ekle olur.',
  'help.guide.create-place.result': 'Yer listede ve haritadadır, bir güne konana kadar Planlanmamış altında.',
  'help.guide.create-place.tip.1':
    'Formun altındaki Dosyalar ve Maliyetler, yere bir belge ekler ya da kaydettikten hemen sonra gideri için Maliyetler düzenleyicisini açar.',
  'help.guide.create-place.tip.2':
    'Her TREK’te aramayı TREK dizini ve OpenStreetMap yanıtlar, Yer ayrıntıları ise kendini Wikipedia, Wikivoyage ve Wikimedia üzerinden doldurur. Google yalnızca ikisi de boş döndüğünde sorulur ve puanı yalnızca o getirir.',
  'help.guide.create-place.tip.3':
    'Bir yer haritada da başlayabilir: noktaya sağ tıklayın, form koordinatlar ve adres doldurulmuş olarak açılır.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Bir yeri doğrudan açık güne ekleyin',
  'help.guide.place-to-open-day.goal': 'İkinci adımı atlayın: yeri oluşturun ya da seçin, hemen o günde olsun.',
  'help.guide.place-to-open-day.step.1':
    'Günler sütununda bir günün başlığına tıklayın. Gün açıktır: kartı vurgulanır ve yerler sütunu Güne düğmesini kazanır.',
  'help.guide.place-to-open-day.step.2':
    'Güne, Yeni yer ile aynı formu açar, yalnızca Ekle düğmesine tıkladığınız anda yer açık güne iner.',
  'help.guide.place-to-open-day.step.3':
    'Zaten var olan bir yer, satırının sonundaki + ile ya da sağ tıklayıp + Gün ile açık güne gider.',
  'help.guide.place-to-open-day.step.4':
    'Tersi de olur, üstelik önce bir gün açmanız gerekmez: yerin satırını sütundan dışarı sürükleyip bir gün kartının üzerine bırakın. İki durağın arasına bırakırsanız tam oraya oturur.',
  'help.guide.place-to-open-day.result':
    'Yer günün altında, en sonda listelenir; ait olduğu yere yukarı ya da aşağı sürükleyin.',
  'help.guide.place-to-open-day.tip.1':
    'Açık gün aramayı da yönlendirir: bir gün açıkken harita ve yakındakiler araması, o günün zaten uğradığı yerden başlar.',
  'help.guide.place-to-open-day.tip.2': 'Günlerin üstündeki araç çubuğundaki Geri al, atamayı geri alır.',
  // filter-places
  'help.guide.filter-places.title': 'Listede bir yer bulun',
  'help.guide.filter-places.goal': 'Sütunu peşinde olduğunuz yerlere daraltın.',
  'help.guide.filter-places.step.1':
    'Üstteki açılır liste Tüm, Planlanmamış (henüz hiçbir günde değil), Planlanmış (bir günde) ve Parçalar (içe aktarılmış GPX izleri) arasında geçiş yapar, her biri kendi sayısıyla.',
  'help.guide.filter-places.step.2': 'Yer ara... alanına yazın; liste siz yazdıkça daralır.',
  'help.guide.filter-places.step.3':
    'Tüm Kategoriler, bir ya da daha fazla kategoriyi işaretleyeceğiniz bir liste açar, aralarında Kategori Yok da vardır; altındaki Filtreyi temizle bunu sıfırlar.',
  'help.guide.filter-places.step.4':
    'Yanındaki yıldız en düşük puanı belirler: 5+, 4+ ve devamı yalnızca en az o kadar puan verdiğiniz yerleri gösterir.',
  'help.guide.filter-places.result': 'Satırların üstündeki sayı kaç yerin uyduğunu söyler; filtreler birleşir.',
  'help.guide.filter-places.tip.1':
    'Bir gün açıkken Planlanmış yalnızca o günü listeler ve bunu söyler: Yalnızca açık gün gösteriliyor, yanında Tüm yolculuğu göster ile.',
  'help.guide.filter-places.tip.2': 'Harita da açık güne daralır; listedeki Tüm yine de gezinin her yerini gösterir.',
  // edit-place
  'help.guide.edit-place.title': 'Bir yeri değiştirin',
  'help.guide.edit-place.goal': 'Bir adı düzeltin, iğneyi taşıyın, bir web sitesi ekleyin ya da kategoriyi değiştirin.',
  'help.guide.edit-place.step.1':
    'Satıra sağ tıklayın ve Düzenle seçeneğini seçin, ya da yeri açıp ayrıntılarında Düzenle düğmesine tıklayın.',
  'help.guide.edit-place.step.2':
    'Neye ihtiyacınız varsa değiştirin: İsim, Tanım, Notlar, Adres, Enlem ve Boylam, Kategori, Web sitesi. Bir günden açıldığında formda ayrıca Bu gün için notlar ve o gün için Başlangıç ile Son bulunur.',
  'help.guide.edit-place.step.3': 'Güncelle düğmesine tıklayın.',
  'help.guide.edit-place.result':
    'Değişiklik yerin göründüğü her yerde geçerlidir: listede, haritada ve bulunduğu her günde.',
  'help.guide.edit-place.tip.1': 'Bu gün için notlar yere o tek günde aittir; Notlar yerin kendisine aittir.',
  'help.guide.edit-place.tip.2':
    'Başlangıç öncesindeki bir Son, Güncelle işlemini engeller; Zaman şununla çakışıyor: yalnızca günün başka bir durağının aynı saate sahip olduğu konusunda uyarır.',
  // delete-place
  'help.guide.delete-place.title': 'Bir yeri silin',
  'help.guide.delete-place.goal': 'Bir yeri geziden temelli çıkarın.',
  'help.guide.delete-place.step.1':
    'Satıra sağ tıklayın ve Sil seçeneğini seçin, ya da yerin ayrıntılarında Sil düğmesine tıklayın.',
  'help.guide.delete-place.step.2':
    'Onaylayın. Yerde bir gece rezerve edilmişse ya da ona bağlı bir rezervasyon varsa, soru onunla birlikte neyin gittiğini söyler.',
  'help.guide.delete-place.result':
    'Yer listeden, haritadan ve her günden kalkar; günlerin üstündeki araç çubuğundaki Geri al onu geri getirir.',
  'help.guide.delete-place.tip.1':
    'Bir yeri yalnızca bir günden almak için, bunun yerine o durakta Günden Kaldır kullanın.',
  'help.guide.delete-place.tip.2': 'Aynı anda birkaç yer: filtrelerin yanındaki onay işareti bir seçim başlatır.',
  // select-places
  'help.guide.select-places.title': 'Aynı anda birkaç yeri değiştirin ya da silin',
  'help.guide.select-places.goal': 'Listeyi tek tek yer yerine bir seferde toparlayın.',
  'help.guide.select-places.step.1':
    'Filtre satırının sağ ucundaki onay işaretine tıklayın. Satırlar onay kutuları alır ve eylemlerin bulunduğu bir çubuk belirir.',
  'help.guide.select-places.step.2':
    'Satırları işaretleyin ya da çubuktaki Tümünü seç düğmesini kullanın; çubuk neyin seçili olduğunu sayar.',
  'help.guide.select-places.step.3':
    'Change category hepsine tek bir kategori verir; Koleksiyona kaydet onları koleksiyonlarınızdan birine kopyalar; Seçileni sil bir onaydan sonra onları kaldırır.',
  'help.guide.select-places.step.4': 'Seçimden çıkmak için onay işaretine yeniden tıklayın.',
  'help.guide.select-places.result':
    'Değişiklik seçili her yer için geçerlidir; bir silme günlerin üstündeki araç çubuğundan geri alınabilir.',
  'help.guide.select-places.tip.1':
    'Siz seçerken filtreler çalışmayı sürdürür: önce Planlanmamış olarak filtreleyin, sonra Tümünü seç tam olarak onları yakalar.',
  'help.guide.select-places.tip.2':
    'Listelerinde ziyaret edildi olarak işaretle, Koleksiyonlar eklentisi açıkken çubukta belirir: yerleri kayıtlı oldukları koleksiyonlarda işaretler.',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX, KML ya da KMZ dosyasından yerleri içe aktarın',
  'help.guide.import-places-file.goal':
    'Google My Maps, Google Earth ya da bir GPS izleyicinin dışa aktardığını içeri getirin.',
  'help.guide.import-places-file.step.1':
    'Dosyayı içe aktar düğmesine tıklayın ya da dosyayı yerler sütununun herhangi bir yerine bırakın.',
  'help.guide.import-places-file.step.2':
    "Dosyayı seçin ya da kutuya sürükleyin. Bir GPX için neyin içe aktarılacağını işaretleyin: Ara noktalar, Rotalar, İzler (yol geometrisi ile); KML ve KMZ için Noktalar (Yer İşaretleri) ve Yollar (LineString'ler).",
  'help.guide.import-places-file.step.3':
    'Kutu aynı anda birkaç dosya alır ve yalnızca .gpx, .kml ve .kmz kabul eder. Başka türde bir dosya ya da 10 MB üzerindeki bir dosya iletişim kutusunda reddedilir ve içe aktarılmaz.',
  'help.guide.import-places-file.step.4':
    'İçe aktar düğmesine tıklayın. Bir mesaj kaç yerin geldiğini söyler; KML ya da KMZ dosyasında iletişim kutusu, neyin oluşturulduğunun ve neyin atlandığının özetiyle açık kalır.',
  'help.guide.import-places-file.result':
    'Yerler listededir; bir iz satırında bir rota işareti taşır, haritada çizilir ve kendi Parçalar filtresini alır.',
  'help.guide.import-places-file.tip.1':
    'Çok büyük bir dosya boyut sınırıyla birlikte reddedilir; onu fotoğraflar olmadan yeniden dışa aktarın ya da bölün.',
  'help.guide.import-places-file.tip.2':
    'İçe aktarma, günlerin üstündeki araç çubuğundan bütün olarak geri alınabilir.',
  // import-places-list
  'help.guide.import-places-list.title': 'Paylaşılan bir Google Maps ya da Naver Maps listesini içe aktarın',
  'help.guide.import-places-list.goal': 'Paylaşılan bir liste bağlantısını yerlere dönüştürün.',
  'help.guide.import-places-list.step.1':
    'Liste İçe Aktarma düğmesine tıklayın ve Google Listesi ya da Naver Listesi seçeneğini seçin.',
  'help.guide.import-places-list.step.2':
    'Listenin paylaşılan bağlantısını yapıştırın. Bir Google Maps yol tarifi bağlantısı da olur: durakları sürüş sırasına göre birer yer olur.',
  'help.guide.import-places-list.step.3': 'İçe aktar düğmesine tıklayın.',
  'help.guide.import-places-list.result':
    'Listenin her yeri gezidedir, listedeki adıyla; gezide zaten bulunan yerler atlanır.',
  'help.guide.import-places-list.tip.1':
    'Listenin herkese açık paylaşılması gerekir; özel bir listenin bağlantısı hiçbir şey içe aktarmaz.',
  'help.guide.import-places-list.tip.2':
    'Yerleri Google ile zenginleştir, TREK’inizde bir Google anahtarı varsa iletişim kutusunda görünür: içe aktarılan her yeri arayıp fotoğrafları, adresi ve ayrıntıları doldurur.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Günler',
  'help.ctx.trip-days.summary':
    'Planın sol sütunu: her gün için bir kart, sırayla durakları, notları, o günün rezervasyonları ve ulaşımı ve duraklar arasındaki rota ile. Gezi asıl burada planlanır.',
  'help.ctx.trip-days.bullet.1':
    'Üstteki araç çubuğu: Dışa aktar (PDF, takvim, GPX), Tüm günleri genişlet / Tüm günleri daralt, geri alma oku, Günleri yeniden sırala ve Tüm rezervasyon rotalarını göster.',
  'help.ctx.trip-days.bullet.2':
    'Bir gün kartı: başlıkta numara, hava durumu, başlık, tarih ve günün maliyeti; günü açmak için başlığa tıklayın, sağdaki ok kartı katlar. Toplu taşıma, Ulaşım ekle ve Not Ekle de başlıkta durur.',
  'help.ctx.trip-days.bullet.3':
    'Bir günün içinde: sırayla duraklar, her biri resim, ad, saat ve resmin üzerinde bir kilitle; notlar; güne ait rezervasyonlar; ve duraklar arasında her etabın yolculuk süresi.',
  'help.ctx.trip-days.bullet.4':
    "Durakların altında rota çubuğu: Rota günü haritaya çizer, Optimize et durakları sıralar, Araba / Yürüyüş günün ulaşım türünü belirler, Google Haritalar'da aç ve CoMaps'te aç ise günü devreder.",
  'help.ctx.trip-days.bullet.5':
    'Yerler bir güne, yerler sütunundan bir satır sürükleyerek, o satırdaki + ile, boş bir günde Bu güne yer ekle ile ya da yerin ayrıntılarından gelir.',
  'help.ctx.trip-days.bullet.6':
    'Alttaki Toplam Maliyet, fiyatı olan her durağı ve her rezervasyonu gezinin para biriminde toplar.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Bir günü okuyun',
  'help.guide.read-day-plan.goal': 'Bir şeyi değiştirmeden önce gün kartının her parçasının size ne söylediğini bilin.',
  'help.guide.read-day-plan.step.1':
    'Başlık: gün numarası, o günün tahmini, 1. gün ya da ona verdiğiniz ad, tarih ve günün maliyeti. Günü açmak için başlığa tıklayın (ayrıntı paneli haritanın üzerinde açılır); sağdaki ok kartı katlar ve açar.',
  'help.guide.read-day-plan.step.2':
    'Bir durak: soldaki tutamak onu sürükler, resim rota optimizasyonu için bir kilit taşır, sonra ad, açıklama ve ayarlıysa Bu gün için notlar gelir. Durağın saatleri varsa bir saat rozeti Başlangıç ve Son değerlerini gösterir; sağ ucunda beliren oklar onu yukarı ya da aşağı taşır.',
  'help.guide.read-day-plan.step.3':
    'Gündeki bir rezervasyon: bir durağa bağlı rezervasyon o durağı Rezervasyon onaylandı ya da Rezervasyon beklemede olarak işaretler, bir ulaşım ise saati ve rotasıyla Kalkış ya da Varış olarak görünür; üzerindeki küçük düğme o rotayı haritada çizer.',
  'help.guide.read-day-plan.step.4':
    'İki durak arasında bağlayıcı, etabın günün ulaşım türüyle ne kadar sürdüğünü ve ne kadar uzun olduğunu söyler; yalnızca o etabın türünü değiştirmek için üzerine tıklayın.',
  'help.guide.read-day-plan.step.5':
    "Sondaki rota çubuğu: Rota günün yolunu haritaya çizer, Optimize et durakları yeniden sıralar, tür düğmeleri Araba ya da Yürüyüş seçer, Google Haritalar'da aç ve CoMaps'te aç ise günü orada açar.",
  'help.guide.read-day-plan.result':
    'Karttaki her simgenin bir anlamı var; aşağıdaki kılavuzlar her birini değiştirir.',
  'help.guide.read-day-plan.tip.1':
    'Menüsü için bir durağa sağ tıklayın: Düzenle, Günden kaldır, Web Sitesini Aç, navigasyon uygulamaları (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Koleksiyona kaydet, Sil.',
  'help.guide.read-day-plan.tip.2':
    'Bir durağın üzerine gelin, sonunda Rezervasyon ekle belirir: orada oluşturulan rezervasyon bu günkü bu durağa bağlıdır.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Bir yeri bir güne koyun',
  'help.guide.place-onto-day.goal': 'Listedeki bir yeri, sırada ait olduğu noktada günün bir durağına dönüştürün.',
  'help.guide.place-onto-day.step.1':
    'Yerler sütunundan bir satırı gün kartına sürükleyin. Tam oraya koymak için iki durak arasına bırakın, sona eklemek için kartın herhangi bir yerine bırakın.',
  'help.guide.place-onto-day.step.2':
    'Sürüklemeden: başlığına tıklayarak günü açın, sonra yerin satırının sonundaki + işaretine tıklayın ya da satıra sağ tıklayıp + Gün seçin.',
  'help.guide.place-onto-day.step.3': 'Boş bir günde Bu güne yer ekle, yer formunu açar ve yeni yer hemen o güne iner.',
  'help.guide.place-onto-day.step.4':
    'Bir yerin ayrıntılarından Güne Ekle hangi gün olduğunu sorar; gün başlığından açıkken yerler sütunundaki Güne, açık günde doğrudan yeni bir yer oluşturur.',
  'help.guide.place-onto-day.result':
    'Yer artık günün bir durağı, haritada günün numarasıyla, ve yerler sütunu onu Planlanmış altında sayar.',
  'help.guide.place-onto-day.tip.1':
    'Bir yer birkaç günde olabilir: ikinci güne yerler sütunundan koyun. Bir durağı bir gün kartından başkasına sürüklemek ise onu taşır.',
  'help.guide.place-onto-day.tip.2': 'Araç çubuğundaki geri alma oku atamayı geri alır.',
  'help.guide.place-onto-day.tip.3':
    'Bir durak, sabit saatli iki kaydın arasına ya da saati belli bir rezervasyonun önüne bırakılamaz; plan kronolojisini korur.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Bir günün sırasını değiştirin',
  'help.guide.reorder-stops.goal': 'Bir durağı yukarı ya da aşağı, ya da başka bir güne taşıyın.',
  'help.guide.reorder-stops.step.1': 'Durağı tutamağından kartın içindeki yeni yerine sürükleyin.',
  'help.guide.reorder-stops.step.2':
    'Ya da durağın sağ ucundaki okları kullanın: her tıklamada bir adım yukarı ya da aşağı.',
  'help.guide.reorder-stops.step.3': 'Durağı başka bir gün kartına sürükleyerek oraya taşıyın; eski günden ayrılır.',
  'help.guide.reorder-stops.step.4':
    'Sabit saatli bir durak, bir taşıma günün sırasını bozacaksa Saat kaldırılsın mı? diye sorar, çünkü yerine saati karar vermişti: Onayla saati bırakır ve durağın istediği yere gitmesine izin verir.',
  'help.guide.reorder-stops.result': 'Rota ve yolculuk süreleri yeni sırayı hemen izler.',
  'help.guide.reorder-stops.tip.1':
    'Sabit zamanlı rezervasyonlar yeniden sıralanamaz; saatlerinin koyduğu yerde otururlar.',
  'help.guide.reorder-stops.tip.2':
    'Rota çubuğundaki Optimize et bütün günü en kısa yola göre sıralar; yerinde kalmasını istediğiniz durağı önce kilitleyin.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Bir durağa saat verin',
  'help.guide.set-stop-times.goal':
    'Bir durağın ne zaman başlayıp bittiğini belirleyin, böylece gün bir program gibi okunur.',
  'help.guide.set-stop-times.step.1':
    'Durağa sağ tıklayın ve Düzenle seçin. Günden açıldığında formun altında Başlangıç ve Son bulunur.',
  'help.guide.set-stop-times.step.2':
    'Başlangıç değerini, isterseniz Son değerini de girin. Zaman şununla çakışıyor: uyarısı günün saatli başka bir durağıyla çakışmayı bildirir; Başlangıç saatinden önceki bir Son, Güncelle düğmesini engeller.',
  'help.guide.set-stop-times.step.3':
    'Güncelle düğmesine tıklayın. Durak bir saat rozeti alır ve saatinin günde ait olduğu yere taşınır.',
  'help.guide.set-stop-times.result':
    'Saatli duraklar sıradaki yerlerini korur; saatsiz duraklar onların çevresine dizilir.',
  'help.guide.set-stop-times.tip.1':
    'Saat, o günkü durağa aittir; aynı yerin başka bir günde başka bir saati olabilir.',
  'help.guide.set-stop-times.tip.2':
    'Saatli bir durağı elle taşımak için sürükleyin: Saat kaldırılsın mı? sorusu, Onayla dediğinizde saati yolda bırakır.',
  'help.guide.set-stop-times.tip.3':
    'Aynı formdaki Bu gün için notlar, yalnızca bu gün için geçerli olanı tutar, ayrılan bir masa, bir bilet numarası.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Bir durağı günden çıkarın',
  'help.guide.remove-from-day.goal': 'Bir yeri geziden silmeden plandan çıkarın.',
  'help.guide.remove-from-day.step.1': 'Durağa sağ tıklayın ve Günden kaldır seçin.',
  'help.guide.remove-from-day.step.2':
    'Durak günden gitti; yer, başka bir günde değilse Planlanmamış altında olmak üzere yerler sütununda kalır.',
  'help.guide.remove-from-day.result': 'Gün, rotası ve maliyeti güncellenir; geri alma oku durağı geri getirir.',
  'help.guide.remove-from-day.tip.1': 'Aynı menüdeki Sil, yeri bütün geziden, her gün dahil, kaldırır.',
  'help.guide.remove-from-day.tip.2': 'Günden Kaldır, yerin ayrıntı panelinde de, Güne Ekle yanında durur.',
  // lock-stop
  'help.guide.lock-stop.title': 'Bir durağı yerine kilitleyin',
  'help.guide.lock-stop.goal': 'Rota optimize edilirken bir durağı olduğu yerde tutun.',
  'help.guide.lock-stop.step.1':
    'Durağın resminin üzerine gelin ve kilide tıklayın: Rota optimizasyonunda konumu koru.',
  'help.guide.lock-stop.step.2':
    'Optimize et artık diğer durakları onun çevresine sıralar; serbest bırakmak için kilide yeniden tıklayın (Kilidi açmak için tıklayın).',
  'help.guide.lock-stop.result': 'Kilit resimde görünür; durak siz açana kadar konumunu korur.',
  'help.guide.lock-stop.tip.1':
    'Sabit saatli bir durak zaten saatiyle kilitlidir; optimizasyon sırasında hiç kımıldamaz.',
  'help.guide.lock-stop.tip.2':
    'Kilit bu ziyaret boyunca sürer: sayfa yeniden yüklendikten sonra her durak yine serbesttir, yalnızca saatli duraklar sabit kalır.',
  // day-note
  'help.guide.day-note.title': 'Bir güne not ekleyin',
  'help.guide.day-note.goal': 'Bir hatırlatmayı, bir bilet numarasını ya da bir B planını doğrudan günün içinde tutun.',
  'help.guide.day-note.step.1': 'Günün başlığındaki Not Ekle düğmesine tıklayın.',
  'help.guide.day-note.step.2':
    'Not alanına bir ad verin, gün kartında görünen budur, gerisini de Günlük Not altına yazın. Metnin üstündeki çubuk onu biçimlendirir (Kalın, listeler, bağlantılar, alıntılar) ve soldaki Önizleme ortaya çıkacak kartı gösterir.',
  'help.guide.day-note.step.3':
    'Not duraklardan ayırt edilsin diye bir Simge ve bir Renk seçin, sonra Ekle düğmesine tıklayın.',
  'help.guide.day-note.step.4':
    'Not günde bir durak gibi oturur: sürükleyerek yerine koyun, Düzenle ve Sil için sağ tıklayın.',
  'help.guide.day-note.result':
    'Not günün bir parçasıdır, PDF içinde de; saatli bir not saatli duraklarla birlikte sıralanır.',
  'help.guide.day-note.tip.1':
    'Saatli bir not, rezervasyonunuz olmayan bir ulaşımın yerini tutabilir: “08:15 S3 merkez istasyondan”.',
  'help.guide.day-note.tip.2': 'Notlar güne özeldir; bütün gezi için bir not İş birliği bölümüne aittir.',
  // day-route
  'help.guide.day-route.title': 'Günün rotasını gösterin ve optimize edin',
  'help.guide.day-route.goal':
    'Duraklar arasındaki yolu görün, nasıl yolculuk ettiğinizi seçin ve sırayı TREK sıralasın.',
  'help.guide.day-route.step.1':
    'Günü açın ve rota çubuğundaki Rota düğmesine tıklayın: duraklar arasındaki yol haritaya çizilir ve duraklar arasındaki bağlayıcılar her etabın süresini ve mesafesini gösterir.',
  'help.guide.day-route.step.2':
    'Yanındaki Araba ve Yürüyüş günün ulaşım türünü belirler; etaplar yeniden hesaplanır. Plugin’ler kendi türlerini ekleyebilir.',
  'help.guide.day-route.step.3':
    'Yalnızca o etabın türünü değiştirmek için bir bağlayıcıya tıklayın: bir tür seçin ya da günün türüne dönmek için Günün varsayılanını kullan seçin.',
  'help.guide.day-route.step.4':
    'Optimize et durakları en kısa yola göre yeniden sıralar. Kilitli ya da sabit saatli duraklar yerlerini korur; günde bir konaklama varsa rota oradan başlar.',
  'help.guide.day-route.step.5':
    "Google Haritalar'da aç ya da CoMaps'te aç, bütün günü o uygulamada bir rota olarak açar, yolda yön bulmak için.",
  'help.guide.day-route.result':
    'Gün saatleri olan bir rotadır; sıra değiştikçe Toplam Maliyet ve etaplar güncellenir.',
  'help.guide.day-route.tip.1':
    'Rotalar varsayılan olarak OSRM’den gelir; yönetici Kullanıcı Varsayılanları altında TREK’i başka bir rota motoruna yönlendirebilir.',
  'help.guide.day-route.tip.2':
    'Rotası hesaplanamayan bir etap süre göstermez; iki durağın da koordinatı olduğunu kontrol edin.',
  'help.guide.day-route.tip.3': 'Geri alma oku bir optimizasyonu geri alır.',
  // manage-days
  'help.guide.manage-days.title': 'Gün ekleyin, sıralayın ve yeniden adlandırın',
  'help.guide.manage-days.goal': 'Yalnızca günlerin üzerindekini değil, günlerin kendisini biçimlendirin.',
  'help.guide.manage-days.step.1':
    'Günler gezinin tarihlerinden gelir; Pano altında gezi kartındaki tarihleri değiştirin, uçlarda gün eklenir ya da düşer. İçinde bir şey olan bir gün düşmeden önce bir liste hangi günlerin gideceğini ve üzerlerinde ne olduğunu gösterir.',
  'help.guide.manage-days.step.2':
    'Araç çubuğundaki Günleri yeniden sırala bir liste açar: Yukarı taşı ve Aşağı taşı bir günü üzerindeki her şeyle birlikte kaydırır, yanlarındaki çöp kutusu Günü sil ise günü kaldırır. Listenin altında sonraki tarihi taşıyan düğme, tarihli son günün hemen ardına bir gün ekler ve geziyi bir gün uzatır; Tarihsiz sona tarihsiz bir gün ekler.',
  'help.guide.manage-days.step.3':
    'Günü sil önce sorar: liste günle birlikte gidenleri, yani yerlerini, notlarını ve rezervasyonlarını, o gün giriş ya da çıkış yapılan konaklamayı ve bir tarih öne kayan günleri gösterir. Günü sil günü kaldırır, İptal korur; son gün silinemez.',
  'help.guide.manage-days.step.4':
    'Bir günü yeniden adlandırmak için onu açın ve haritanın üzerindeki ayrıntı panelinde başlığının yanındaki kaleme tıklayın; ad, kartta ve PDF içinde 1. gün yerine geçer.',
  'help.guide.manage-days.step.5':
    'Araç çubuğundaki Tüm günleri genişlet ve Tüm günleri daralt bütün kartları birden katlar; tek bir kart kendi okuyla katlanır.',
  'help.guide.manage-days.result':
    'Tarihler konumda kalır: yukarı taşınan bir gün daha erken tarihi alır, durakları, notları ve rezervasyonları onunla birlikte gider.',
  'help.guide.manage-days.tip.1': 'Günleri taşımak araç çubuğundan geri alınabilir, bir günü silmek alınamaz.',
  'help.guide.manage-days.tip.2':
    'Bir günün başlığındaki maliyet, o günün fiyat taşıyan duraklarını ve rezervasyonlarını toplar.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Plandaki rezervasyonları ve ulaşımı okuyun',
  'help.guide.bookings-in-plan.goal':
    'Bir rezervasyon var olduktan sonra nerede göründüğünü ve onu hangi ekranın oluşturduğunu bilin.',
  'help.guide.bookings-in-plan.step.1':
    'Bir ulaşım (Uçuş, Tren, Feribot, Otobüs, Araba) kalktığı günde Kalkış, vardığı günde Varış olarak saatiyle ve rotasıyla görünür; birkaç gün süren biri aradaki günlere yayılır.',
  'help.guide.bookings-in-plan.step.2':
    'Bir durağa bağlı rezervasyon (bir Restoran, bir Tur) o durağı Rezervasyon onaylandı ya da Rezervasyon beklemede olarak işaretler; günü olan ama durağı olmayan bir rezervasyon günde kendi satırıdır.',
  'help.guide.bookings-in-plan.step.3':
    'Otelde bir gece bir konaklamadır: günün ayrıntı panelinde Konaklama altında, Giriş saatinden Çıkış saatine kadar oturur ve o günlerin her birinin rotası oradan başlar.',
  'help.guide.bookings-in-plan.step.4':
    'Haritada, bir ulaşım satırındaki düğme onun rotasını çizer; araç çubuğundaki Tüm rezervasyon rotalarını göster hepsini çizer.',
  'help.guide.bookings-in-plan.step.5':
    'Oluşturma: üzerine gelinen bir durakta Rezervasyon ekle, gün başlığında Ulaşım ekle ve Toplu taşıma, içe aktarma ve dosyalarla tam liste için de Rezervasyonlar ve Ulaşım sekmeleri.',
  'help.guide.bookings-in-plan.result': 'Bir rezervasyon, planda bir yer; sekmeler aynı rezervasyonların liste hali.',
  'help.guide.bookings-in-plan.tip.1':
    'Onaylandı ve Askıda olması, rezervasyona sizin verdiğiniz durumlardır; plan bunları durakta gösterir, Rezervasyonlar sekmesi ikisini de sayar.',
  'help.guide.bookings-in-plan.tip.2':
    'Sabit saatli bir ulaşım sürüklenemez; bunun yerine saatini rezervasyonda değiştirin.',
  // export-plan
  'help.guide.export-plan.title': 'Planı dışa aktarın',
  'help.guide.export-plan.goal': 'Planı bir belge olarak, takviminize ya da bir GPS cihazına götürün.',
  'help.guide.export-plan.step.1': 'Günlerin üstündeki araç çubuğunda Dışa aktar düğmesine tıklayın.',
  'help.guide.export-plan.step.2':
    "Belge: PDF'ler her günün durakları, notları ve rezervasyonlarıyla yazdırma görünümünü açar; Her gün için sayfa sonu her günü yeni bir sayfada başlatır, PDF olarak Kaydet ise onu indirir.",
  'help.guide.export-plan.step.3':
    'Takvim: .ics indir rezervasyonları bir takvim dosyası olarak kaydeder; Takvime abone ol, takvim uygulamanızın kendi kendine yenilediği bir bağlantı verir.',
  'help.guide.export-plan.step.4':
    'Haritalar ve GPS · GPX: Tüm gezi yerleri, gün rotalarını ve izleri dışa aktarır; Yalnızca yerler sadece iğneleri; Günler rota olarak ise çevrimdışı haritalar ve GPS cihazları için her güne bir rota.',
  'help.guide.export-plan.result': 'Dosya iner; gezide hiçbir şey değişmez.',
  'help.guide.export-plan.tip.1':
    "Tek bir gün kendi rota çubuğundan bir harita uygulamasına gider: Google Haritalar'da aç ya da CoMaps'te aç.",
  'help.guide.export-plan.tip.2':
    'Takvime abone ol için ayarlarınızda takvim aboneliğinin açık olması gerekir; Pano bunun için bir kılavuz içerir.',
  'help.guide.export-plan.tip.3': 'Dışa aktarmak okumaktır: gezinin her üyesi yapabilir.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Yer ayrıntıları',
  'help.ctx.trip-place.summary':
    'Bir yer seçtiğinizde haritanın üzerinde açılan kart: gezinin onun hakkında bildiği her şey, herkesin ona verdiği yıldızlar, görseli ve dosyaları, ve onu açık güne, bir listeye ya da bir harita uygulamasına koyan düğmeler.',
  'help.ctx.trip-place.bullet.1':
    'Yerler sütununda bir satıra, bir günün içindeki bir durağa ya da haritadaki bir işaretçiye tıklayın, kart haritanın üzerinde açılır. Onu günün içinden seçmek karta hangi durağı kastettiğinizi söyler, durağın katılımcılarını ve rezervasyonunu da beraberinde getiren budur.',
  'help.ctx.trip-place.bullet.2':
    'Baş kısım yuvarlak görseli, adı, kategoriyi, adresi ve koordinatları taşır. Kendi görselinizi kullanmak için görsele tıklayın, yeri yerinde yeniden adlandırmak için ada çift tıklayın, sağdaki X ise kartı kapatır.',
  'help.ctx.trip-place.bullet.3':
    'Altında: varsa fiyat, her gezginin yere verdiği yıldızlar, açıklama ve notlar, ve durak bir tane taşıyorsa Bu gün için notlar.',
  'help.ctx.trip-place.bullet.4':
    'Geçerli oldukları ölçüde Açılış Saatleri, İz rengi, İstatistikleri Takip Et ve Dosyalar gelir. Dosyalar klasörlerinizden her şeyi alır ve bu durağın rezervasyonunda asılı olanı da listeler.',
  'help.ctx.trip-place.bullet.5':
    'Alttaki satır: bir gün açıkken Güne Ekle ya da Günden Kaldır, sonra Koleksiyona kaydet, Navigasyon, Web Sitesini Aç, Düzenle ve Sil.',
  'help.ctx.trip-place.bullet.6':
    'Aramadan seçilen bir yer, TREK dizininin ya da OpenStreetMap’in onun hakkında bildiklerini taşır: görselin çevresinde, yerin kendi saatine göre yargılanan yeşil bir Açık ya da kırmızı bir Kapalı halkası, yıldızların altında telefon numarası, daha aşağıda satırında günün çizgisi ve bir tıklamanın arkasında bütün haftayla Açılış Saatleri, ve Web Sitesini Aç arkasında web sitesi. Google’ın puanı yalnızca Google ile bulunmuş bir yerde, Google anahtarı olan bir TREK’te görünür.',
  // read-place
  'help.guide.read-place.title': 'Kartın size bir yer hakkında anlattıkları',
  'help.guide.read-place.goal': 'Gezinin tek bir yer hakkında bildiği her şeyi tek bir kartta okuyun.',
  'help.guide.read-place.step.1':
    'Günler sütununda okumak istediğiniz durağa tıklayın. Kart haritanın üzerinde açılır ve durak kendi gününde işaretli kalır.',
  'help.guide.read-place.step.2':
    'Baş kısım: yuvarlak görsel, ad, adres ve tam koordinatlar. Görselin çevresinde Açık yazan yeşil ya da Kapalı yazan kırmızı bir halka, TREK saatlerini öğrendiğinde, yerin şu anda kendi saatine göre açık olup olmadığını söyler. Sağdaki X kartı yeniden kapatır.',
  'help.guide.read-place.step.3':
    'Altında her gezginin yere verdiği yıldızlar, ortalamayla ve kaç kişinin oy verdiğiyle. Kimse vermediği sürece Henüz puanlanmadı. Hemen altında, yerin varsa telefon numarası: ona tıklamak numarayı telefon uygulamanıza verir.',
  'help.guide.read-place.step.4':
    'Sonra açıklama ve onun altında notlar. İkisi de yerin formundaki metindir, işlenmiş hâliyle: listeler, bağlantılar ve kalın yazı çalışır.',
  'help.guide.read-place.step.5':
    'Katılımcılar bu durağa kimin gittiğini söyler. Siz birini çıkarana kadar herkes içindedir.',
  'help.guide.read-place.step.6':
    'Daha aşağıda Açılış Saatleri: satır baktığınız günün saatlerini taşır ve ona tıklamak o gün kalın yazılmış olarak bütün haftayı açar. Dosyalar yanında durur.',
  'help.guide.read-place.result':
    'Kart, siz X ile kapatana ya da başka bir yer seçene kadar açık kalır, haftanın saatleri açık kalır ve ait olduğu durak günler sütununda işaretli kalır.',
  'help.guide.read-place.tip.1':
    'Yerler sütunundan seçildiğinde kart yeri bilir ama durağı bilmez, bu yüzden katılımcı da rezervasyon da göstermez. Bunun yerine durağı günün içinden seçin, ikisi de oradadır.',
  'help.guide.read-place.tip.2':
    'Formu açmadan yeri yeniden adlandırmak için ada çift tıklayın. Enter kaydeder, Escape değişikliği bırakır.',
  'help.guide.read-place.tip.3':
    'Elle yazılmış bir yer bunların hiçbirini göstermez: kart yalnızca formunun tuttuğunu bilir. Düzenle ile açın, Yerleri ara... altındaki önerilerden seçin ve Güncelle düğmesine tıklayın; saatler, telefon numarası ve web sitesi onunla gelir. Google’ın puanı bir Google anahtarı ister.',
  // rate-place
  'help.guide.rate-place.title': 'Bir yeri puanlayın',
  'help.guide.rate-place.goal': 'Bir yere kendi yıldızlarınızı verin ve herkesin ona ne verdiğini görün.',
  'help.guide.rate-place.step.1':
    'Yeri açın. Yıldız satırı tam baş kısmın altında oturur ve şimdiye kadarki oyların ortalamasını, sayıları parantez içinde, taşır.',
  'help.guide.rate-place.step.2':
    'Kastettiğiniz yıldıza tıklayın. Üzerlerinde ilerledikçe yıldızlar dolar, böylece ne vermek üzere olduğunuzu görürsünüz.',
  'help.guide.rate-place.step.3':
    'Oyunuz ortalamaya hemen sayılır ve yanındaki yüzler oy verenlerdir. Herkesin yıldızlarını görmek için imleci satırın üzerinde bekletin.',
  'help.guide.rate-place.step.4':
    'Aynı ortalama yerler sütununda yerin satırında oturur, böylece iyiler listede öne çıkar.',
  'help.guide.rate-place.result':
    'Yıldızlarınız yerin üzerinde tüm gezinin göreceği şekilde durur ve listenin üstündeki filtre satırındaki Puana göre filtrele yıldızı artık yalnızca bir alt sınıra ulaşan yerleri tutabilir.',
  'help.guide.rate-place.tip.1':
    'Her gezgin puanlayabilir, Yer ekle / düzenle / sil hakkının yalnızca bazılarınızda olduğu bir gezide bile.',
  'help.guide.rate-place.tip.2':
    'Oyunuzu geri almak için zaten verdiğiniz yıldıza tıklayın. Oy veren kimse kalmayınca yer yeniden Henüz puanlanmadı der.',
  'help.guide.rate-place.tip.3':
    'Yıldızların yanına yüz olarak en fazla altı oy veren sığar; ipucu balonu hepsinin adını verir ve sizinkini işaretler.',
  // place-image
  'help.guide.place-image.title': 'Bir yere kendi görselinizi koyun',
  'help.guide.place-image.goal': 'Otomatik küçük resmi kendi fotoğrafınızla değiştirin.',
  'help.guide.place-image.step.1': 'Yeri yerler sütunundan açın.',
  'help.guide.place-image.step.2':
    'İmleci baş kısımdaki yuvarlak görselin üzerinde bekletin: bir fotoğraf makinesi belirir ve ipucu balonunda Görsel yükle yazar. Ona tıklayın ve dosyanızı seçin.',
  'help.guide.place-image.step.3': 'Baş kısım artık sizin görselinizi gösterir, köşesinde küçük kırmızı bir X ile.',
  'help.guide.place-image.step.4': 'Aynı görsel yerler sütununda yerin satırında ve haritadaki işaretçisinde durur.',
  'help.guide.place-image.result':
    'Görseliniz her yerde yerin görselidir: kartta, yerler sütununda, gündeki durakta, haritadaki işaretçide ve paylaşılan bir gezide.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF ve WebP kabul edilir, bir iPhone’dan gelen HEIC ise içeri girerken dönüştürülür.',
  'help.guide.place-image.tip.2':
    'Köşedeki X görselinizi yeniden kaldırır ve otomatik olan geri gelir. Yerin kendisine dokunulmaz.',
  'help.guide.place-image.tip.3':
    'Kendi görseliniz yoksa TREK yerin koordinatlarından bir görsel arar, bulamazsa kategorinin simgesine düşer.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Yeri açık güne koyun ya da oradan alın',
  'help.guide.place-day-assign.goal':
    'Satırı planlayıcının üzerinden sürüklemek yerine kartın kendi düğmesini kullanın.',
  'help.guide.place-day-assign.step.1':
    'Günler sütununda bir günün başlığına tıklayın. O gün artık açık olandır ve kart onu esas alır.',
  'help.guide.place-day-assign.step.2':
    'Yerler sütununda o günde olmayan bir yere tıklayın. Kartı açılır ve alttaki satır Güne Ekle sunar.',
  'help.guide.place-day-assign.step.3':
    'Güne Ekle düğmesine tıklayın. Durak günün sonuna iner ve düğme Günden Kaldır olur.',
  'help.guide.place-day-assign.step.4': 'Durak artık gündedir, listede sonuncu. Ait olduğu yere yukarı sürükleyin.',
  'help.guide.place-day-assign.step.5':
    'Günden Kaldır o durağı günden yeniden alır ve kart bir kez daha Güne Ekle sunar.',
  'help.guide.place-day-assign.result':
    'Gün durağı taşır ya da artık taşımaz, yerin kendisi her iki durumda da dokunulmadan kalır.',
  'help.guide.place-day-assign.tip.1':
    'Düğme yalnızca bir gün açıkken vardır. Gün olmadan kartın yeri ekleyeceği bir şey yoktur.',
  'help.guide.place-day-assign.tip.2':
    'Bir durağı günden almak yeri gezide ve yerler sütununda bırakır. Onu her yerden kaldıran Sil düğmesidir.',
  'help.guide.place-day-assign.tip.3':
    'Bir konaklama rezervasyonunun güne koyduğu bir durak iki düğmeyi de sunmaz: o gece günün Konaklama bölümünde eklenir ve kaldırılır.',
  // place-participants
  'help.guide.place-participants.title': 'Bu durağa kimin gittiğini söyleyin',
  'help.guide.place-participants.goal': 'Geziyi bölmeden grubu tek bir durak için bölün.',
  'help.guide.place-participants.step.1':
    'Günün içindeki durağa tıklayın. Kart açılır ve Katılımcılar gezideki herkesi listeler.',
  'help.guide.place-participants.step.2':
    'Bir gezgini bu duraktan çıkarmak için onun etiketine tıklayın. İmleci üzerinde gezdirdikçe ad üstü çizili görünür.',
  'help.guide.place-participants.step.3':
    'Biri eksilir eksilmez kesik çizgili bir + belirir. Durakta kimin olmadığını görmek için ona tıklayın.',
  'help.guide.place-participants.step.4':
    'Birini geri koymak için adına tıklayın. Herkes geri döndüğünde durak yine tüm grubundur.',
  'help.guide.place-participants.result':
    'Durak seçtiğiniz gezginleri taşır, grubun geri kalanı ise o öğleden sonrayı kendine ayırır.',
  'help.guide.place-participants.tip.1':
    'Katılımcılar yalnızca bir durak seçiliyken görünür, bu yüzden yeri yerler sütunundan değil günün içinden seçin, ve yalnızca birden fazla gezgini olan bir gezide.',
  'help.guide.place-participants.tip.2':
    'Kimse seçili değilse herkes gidiyor demektir, bu yüzden bir durakta kalan son gezgin çıkarılamaz.',
  'help.guide.place-participants.tip.3': 'Kendi hesabı olmayan bir Misafir de herkes gibi katılımcı olabilir.',
  // place-booking
  'help.guide.place-booking.title': 'Bir duraktaki rezervasyon',
  'help.guide.place-booking.goal': 'Bir durağa ait rezervasyonu okuyun, açın ve ona yeni bir tane iliştirin.',
  'help.guide.place-booking.step.1':
    'Rezervasyonun ait olduğu durağı açın. Kart, Onaylandı ya da Askıda olması ile rezervasyonun adını taşıyan bir şerit gösterir.',
  'help.guide.place-booking.step.2':
    'Şerit Tarih, Zaman ve Rezervasyon Kodu ile rezervasyonun sahip olduğu notları taşır.',
  'help.guide.place-booking.step.3': 'Şeride tıklayın. Rezervasyonun kendi formu onun üzerinde açılır.',
  'help.guide.place-booking.step.4':
    'Bir rezervasyonu bir durağa iliştiren şey Gün atamasına bağla alanıdır ve burada zaten bu durağın adını verir. Formu yeniden kapatın.',
  'help.guide.place-booking.step.5':
    'Bir durak için yeni bir rezervasyon günler sütununda başlar: imleci durağın üzerine getirin ve sonundaki + işaretine tıklayın. Form Yeni Rezervasyon olarak, ona bağlı hâlde açılır.',
  'help.guide.place-booking.result':
    'Rezervasyon durakta asılıdır: karttadır, gündedir ve dosyaları burada da Dosyalar altında listelenir.',
  'help.guide.place-booking.tip.1':
    'Şerit yalnızca rezervasyonun iliştirildiği durak için görünür. Durağı olmayan bir rezervasyon Rezervasyonlar sekmesinde yaşar.',
  'help.guide.place-booking.tip.2':
    'Birkaç rezervasyon tek bir durağı paylaşabilir: öğle yemeği ve aynı kapıdan başlayan tur.',
  'help.guide.place-booking.tip.3':
    'Bir tren, bir uçuş ya da bir feribot bunun yerine ulaşım formunu açar, Ulaşım sekmesinin kullandığı formu.',
  // place-files
  'help.guide.place-files.title': 'Bir yerin biletlerini yerin yanında tutun',
  'help.guide.place-files.goal': 'Bir yere ait bileti, kuponu ya da haritayı arayacağınız yere koyun.',
  'help.guide.place-files.step.1':
    'Yeri açın. Dosyalar kartın en altında oturur ve yerin hiç dosyası yokken Dosyalar yazar.',
  'help.guide.place-files.step.2': 'Yanındaki Yükle düğmesine tıklayın ve dosyayı seçin.',
  'help.guide.place-files.step.3': 'Düğme yerin tuttuklarını sayar ve liste kendiliğinden açılır.',
  'help.guide.place-files.step.4': 'Her satır dosyanın adı ve boyutudur. Dosyayı açmak için satıra tıklayın.',
  'help.guide.place-files.result':
    'Dosya yerin üzerinde oturur, kartta sayılır ve gezinin Dosyalar sekmesinde de bulunur.',
  'help.guide.place-files.tip.1':
    'Dosyalar bu durağın rezervasyonunda asılı olanı da listeler, böylece bir otel onayı otelde görünür.',
  'help.guide.place-files.tip.2': 'Yükle aynı anda birkaç dosya alır.',
  'help.guide.place-files.tip.3':
    'Dosya yükle hakkı olmadan Yükle düğmesi orada değildir; yerde zaten duran dosyalar yine oradadır.',
  // place-navigation
  'help.guide.place-navigation.title': 'Bir yeri bir harita uygulamasında ya da web sitesinde açın',
  'help.guide.place-navigation.goal': 'Yeri, sizi gerçekten oraya götürecek uygulamaya devredin.',
  'help.guide.place-navigation.step.1': 'Yeri açın ve alttaki satırda Navigasyon düğmesine tıklayın.',
  'help.guide.place-navigation.step.2':
    'Liste, bu yere uyan harita uygulamalarıdır: Google Maps, Waze, Apple Maps, OpenStreetMap ve CoMaps.',
  'help.guide.place-navigation.step.3':
    'Kullandığınıza tıklayın. TREK yapabildiği yerde ona yalnızca bir çift koordinatı değil, yerin kendisini verir, böylece doğru girişte inersiniz.',
  'help.guide.place-navigation.step.4':
    'Yanındaki Web Sitesini Aç, yerin kendi sayfasını, saatlerini ve biletlerini yeni bir sekmede açar.',
  'help.guide.place-navigation.result':
    'Harita uygulaması yerin üzerinde açılır, web sitesi kendi sekmesinde, ve gezide hiçbir şey değişmez.',
  'help.guide.place-navigation.tip.1':
    'Waze hemen yol tarifine başlar. Diğerleri yeri açar, oradan başlatmak bir dokunuş daha ister.',
  'help.guide.place-navigation.tip.2':
    'Hangi uygulamaların sunulduğu yere ve cihazınıza bağlıdır: Apple Maps Android’de dışarıda kalır, 高德地图 yalnızca Çin’deki bir yer için gelir, Waze, Apple Maps ve CoMaps ise yerin koordinatlarına ihtiyaç duyar.',
  'help.guide.place-navigation.tip.3':
    'Yalnızca tek bir uygulama geçerliyse düğme o uygulamanın adını taşır ve onu hemen açar.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Bir yeri listelerinizden birine kaydedin',
  'help.guide.place-to-collection.goal': 'Bu gezide bulduğunuz bir yeri bir sonrakine saklayın.',
  'help.guide.place-to-collection.step.1': 'Yeri açın ve kartın altındaki Koleksiyona kaydet düğmesine tıklayın.',
  'help.guide.place-to-collection.step.2':
    'Listeye kaydet, sahip olduğunuz ya da paylaştığınız her listeyi gösterir. Bir onay işareti bu yeri zaten tutanları işaretler.',
  'help.guide.place-to-collection.step.3': 'Listeye tıklayın. Yer hemen onun içindedir.',
  'help.guide.place-to-collection.step.4': 'Kapatın, karttaki düğmede Kaydedildi yazar.',
  'help.guide.place-to-collection.result':
    'Yer, görseli, notları ve adresiyle listenizdedir, bir sonraki geziye hazır.',
  'help.guide.place-to-collection.tip.1':
    'Düğme yalnızca Koleksiyonlar eklentisi açıkken vardır, onu yönetici Eklentiler altında açar.',
  'help.guide.place-to-collection.tip.2':
    'Bir yer aynı anda birkaç listede durabilir, her birinde kendi durumuyla: birinde Fikir, diğerinde Gidildi.',
  'help.guide.place-to-collection.tip.3':
    'Seçicide yerin adının yanındaki Ziyaret edildi işaretle onu listede işaretler; yer sizin birkaç listenizdeyse etikette Her yerde ziyaret edildi yazar ve hepsini aynı anda halleder.',
  // place-track
  'help.guide.place-track.title': 'Bir izi okuyun ve ona kendi rengini verin',
  'help.guide.place-track.goal':
    'İçe aktarılmış bir yürüyüşün ne kadar uzun olduğunu görün ve çizgisini haritadaki diğerlerinden ayırt edin.',
  'help.guide.place-track.step.1':
    'Yerler sütununda bir izin satırı, çizgisinin çizildiği renkte kısa bir çizgi taşır. Ona tıklayın.',
  'help.guide.place-track.step.2': 'İstatistikleri Takip Et, ayarladığınız mesafe biriminde yolun uzunluğunu verir.',
  'help.guide.place-track.step.3':
    'Üstündeki İz rengi kullanılan rengi gösterir. Renk örneklerini açmak için satıra tıklayın.',
  'help.guide.place-track.step.4': 'Bir renk seçin. Haritadaki çizgi ve satırdaki kısa çizgi onunla birlikte değişir.',
  'help.guide.place-track.step.5':
    'Soldaki kesik çizgili hücre, Otomatik renk, ize miras aldığı rengi geri verir; sağdaki damlalık, Özel renk seç, başka her şey için sisteminizin renk seçicisini açar.',
  'help.guide.place-track.result': 'İz seçtiğiniz renkte çizilir, kartta, yerler sütunundaki satırında ve haritada.',
  'help.guide.place-track.tip.1':
    'Bu iki bölüm yalnızca bir yol taşıyan, GPX, KML ya da KMZ dosyasından içe aktarılmış bir yerde bulunur.',
  'help.guide.place-track.tip.2':
    'Yüksekliklerle kaydedilmiş bir iz ayrıca en yüksek ve en alçak noktasını, yukarı ve aşağı metreleri ve yürüyüşün profilini gösterir.',
  'help.guide.place-track.tip.3':
    'Bir içe aktarma getirdiği her ize kendi rengini verir, böylece iki yürüyüş asla aynı renkle gelmez.',
  // read-place
  'help.guide.read-place.step.7':
    'Alttaki satır buradan yapabilecekleriniz: yeri açık günden almak ya da oraya koymak, bir listeye kaydetmek, bir harita uygulamasında açmak, düzenlemek ya da silmek.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Dosyalar',
  'help.ctx.trip-files.summary':
    'Gezinin her belgesi tek bir listede: biletler, onaylar, cüzdan kartları ve resimler, her biri bir notla, ait olduğu yere ya da rezervasyona bir bağla ve içinden geri çıkabileceği bir çöp kutusuyla.',
  'help.ctx.trip-files.bullet.1':
    'Üstteki Dosyaları buraya bırakın dosyaları alır; kutuya bir tıklama dosya seçiciyi açar. Altındaki satır bu TREK’in kabul ettiği dosya türlerini ve dosya başına 50 MB sınırını listeler.',
  'help.ctx.trip-files.bullet.2':
    "Sekmeler listenin ne gösterdiğini söyler: Tüm, PDF'ler, Görseller ve Belgeler, her biri kendi sayısıyla. Bir dosya yıldızlanır yıldızlanmaz yanlarına bir yıldız katılır, bir not ek taşır taşımaz da İşbirliği Notları.",
  'help.ctx.trip-files.bullet.3':
    'Bir satır kimin yüklediğini, adı, altındaki notu, boyutu ve tarihi taşır, bir de her bağ için bir rozet: Gün Planı ve yer, Rezervasyon ya da Ulaşım ve rezervasyon, İşbirliği notlarından.',
  'help.ctx.trip-files.bullet.4':
    'Satırın sonunda Yıldızla, Ata, Aç, İndir ve Sil durur. Sil sormaz: dosya çöp kutusuna gider, oradan geri getirilebilir.',
  'help.ctx.trip-files.bullet.5':
    'Bir resim ya da video tam ekran açılır, ok tuşlarıyla ve bir küçük resim şeridiyle; her başka belge sayfanın üstünde bir önizlemede açılır, Yeni sekmede aç ve İndir ile. Bir cüzdan kartı doğrudan indirilir.',
  'help.ctx.trip-files.bullet.6':
    'Sağ uçtaki Çöp kutusu listeyi silinen dosyalara çevirir, orada her biri geri yüklenir ya da kalıcı olarak silinir ve Çöp kutusunu boşalt hepsini temizler. Bir yöneticinin bir belge deposu bağladığı yerde yanında Belge eşitleme durur.',
  // files-upload
  'help.guide.files-upload.title': 'Geziye bir belge koyun',
  'help.guide.files-upload.goal':
    'Bir bileti, bir onayı ya da bir fotoğrafı indirilenler klasörünüzden çıkarıp geziye koyun, orada gezideki herkes ona ulaşabilir.',
  'help.guide.files-upload.step.1':
    'Geziyi açın ve sekme çubuğunda Dosyalar’a tıklayın. Gezinin belgeleri orada listelenir, üstlerinde de yükleme kutusu durur.',
  'help.guide.files-upload.step.2':
    'Dosyaları buraya bırakın kutusuna tıklayın ve bir ya da birkaç dosya seçin. Birbiri ardına yüklenirler ve bu sürerken kutuda Yükleniyor... yazar. Kutunun altındaki satır bu TREK’in hangi türleri aldığını ve bir dosyanın en fazla 50 MB olabileceğini söyler.',
  'help.guide.files-upload.step.3':
    'Son dosya yüklenir yüklenmez onun için Dosya Ata kendiliğinden açılır. Not ekleyin... dosyaya kendine ait bir satır verir, altındaki listeler de onu bir yere ya da bir rezervasyona bağlar. × ile kapatın; kapatmakla hiçbir şey kaybolmaz.',
  'help.guide.files-upload.step.4':
    'Yeni dosyalar listenin en üstünde durur. Bir satır kimin yüklediğini, adı, boyutu ve tarihi gösterir; bir resim küçük bir önizleme alır, her başka dosya kendi türünü.',
  'help.guide.files-upload.result': 'Belgeler gezidedir ve geziyi görebilen herkes onları açabilir ve indirebilir.',
  'help.guide.files-upload.tip.1':
    'Bir dosya masaüstünden doğrudan kutunun üzerine de sürüklenebilir; dosya üzerindeyken kutu aydınlanır.',
  'help.guide.files-upload.tip.2':
    'Panodaki bir resim Ctrl+V ile listeye girer, böylece bir rezervasyonun ekran görüntüsünü önce kaydetmek hiç gerekmez.',
  'help.guide.files-upload.tip.3':
    'Yükleme, Dosya yükle hakkını gerektirir; o olmadan kutu hiç yoktur. Listede olmayan bir tür bir iletiyle geri çevrilir ve hiçbir şey yüklenmez. 50 MB’ı aşan bir dosyayı kutunun kendisi, daha hiçbir şey gönderilmeden eler.',
  // files-link
  'help.guide.files-link.title': 'Bir belgeyi bir yere ya da bir rezervasyona bağlayın',
  'help.guide.files-link.goal': 'Biletin yalnızca bu listeden değil, ait olduğu günden de bulunabilmesini sağlayın.',
  'help.guide.files-link.step.1':
    'Satırın sonundaki kalem olan Ata düğmesine tıklayın. Dosyanın adını taşıyan Dosya Ata açılır.',
  'help.guide.files-link.step.2':
    'Not altında Not ekleyin... bir satır alır, o da listede dosyanın adının altında durur. Kutudan çıktığınız anda kaydedilir.',
  'help.guide.files-link.step.3':
    'Yer altında gezinin yerleri, bulundukları güne göre gruplanmış olarak durur, hiçbir günde olmayanlar için de sonda Atanmamış. Birine tıklayın, bir onay işareti alır.',
  'help.guide.files-link.step.4':
    'Rezervasyon ve Ulaşım altında gezinin rezervasyonları durur. Belgenin ait olduğuna tıklayın; o da kendi onay işaretini alır.',
  'help.guide.files-link.step.5': '× ile kapatın. Burada kaydet düğmesi yoktur: her tıklama, yaptığınız anda yazıldı.',
  'help.guide.files-link.result':
    'Satır notu ve her bağ için bir rozet taşır, Gün Planı ve yerin adı, Ulaşım ve uçuşun adı, belge de hem yerde hem uçuşta asılı durur.',
  'help.guide.files-link.tip.1':
    'Bir dosya aynı anda birkaç bağ tutabilir, böylece aynı onay hem otele hem de kapsadığı geceye ait olur.',
  'help.guide.files-link.tip.2': 'İşaretli bir girdiye yeniden tıklamak o bağı kaldırır; dosyanın kendisi kalır.',
  'help.guide.files-link.tip.3':
    'Tersi de geçerlidir: bir yere ya da bir rezervasyona eklenmiş bir belge bu listede de vardır, satırında aynı rozetle.',
  // files-star
  'help.guide.files-star.title': 'Önemli belgeleri üstte tutun',
  'help.guide.files-star.goal': 'Gezi boyunca büyüyen bir listeden, gerçekten gerekecek iki üç kağıdı çekip çıkarın.',
  'help.guide.files-star.step.1':
    'Satırın sonundaki Yıldızla düğmesine tıklayın. Sarıya dolar, dosyanın adının önünde ikinci bir yıldız belirir ve düğmede artık Yıldızı kaldır yazar.',
  'help.guide.files-star.step.2':
    'Liste kendini yeniden sıralar: yıldızlı dosyalar diğerlerinin üstünde durur, her grubun içinde en yeniler önce.',
  'help.guide.files-star.step.3':
    'Üstteki sekmelere bir yıldız katıldı, arkasında yıldızlı dosyaların sayısıyla. Yalnızca onları görmek için ona tıklayın.',
  'help.guide.files-star.result':
    'Gişede gereken kağıtlar listenin en üstünde durur ve bir sekme başka hiçbir şey göstermez.',
  'help.guide.files-star.tip.1':
    'Yıldız sekmesi yalnızca bir şey yıldızlıyken vardır. Son dosyanın yıldızını kaldırın, sekme de onunla birlikte gider.',
  'help.guide.files-star.tip.2':
    'Yıldızlamak bir düzenleme sayılır: gezinin dosyalarını yalnızca okuyabilen bir üye yıldızları görür ama koyamaz.',
  // files-filter
  'help.guide.files-filter.title': 'Listede bir belge bulun',
  'help.guide.files-filter.goal': 'Her şeyin listesini, aradığınız tek tür kağıda daraltın.',
  'help.guide.files-filter.step.1':
    "Listenin üstündeki sekmeler Tüm, PDF'ler, Görseller ve Belgeler’dir, her biri arkasında dosya sayısıyla.",
  'help.guide.files-filter.step.2': "PDF'ler sekmesine tıklayın: liste PDF dosyalarını tutar, başka hiçbir şeyi değil.",
  'help.guide.files-filter.step.3':
    'İki sekme daha gezide ne olduğuna göre gelir gider. İş birliği sekmesindeki bir not ek taşır taşımaz orada olan İşbirliği Notları sekmesine tıklayın: liste o dosyaları tutar, başka hiçbir şeyi değil. Bir dosya yıldızlanır yıldızlanmaz aynı şekilde sıraya bir yıldız katılır.',
  'help.guide.files-filter.step.4': 'Tüm, listenin tamamını geri getirir.',
  'help.guide.files-filter.result':
    'Liste yalnızca sekmenin adlandırdığını gösterir ve her sekmedeki sayı bunun kaç olduğunu söyler.',
  'help.guide.files-filter.tip.1':
    'Burada klasör yoktur ve yeniden adlandırma yoktur: bir belge Dosya Ata içindeki nota, yerlere ve rezervasyonlara bağlarına ve yıldıza göre düzenlenir.',
  'help.guide.files-filter.tip.2':
    'Listenin kendisi her zaman önce yıldızlı, sonra en yeni sırasıyla gider, böylece bugün yüklenen bir belge geçen ayki bir belgenin üstünde durur.',
  // files-preview
  'help.guide.files-preview.title': 'Bir belgeyi TREK’ten çıkmadan okuyun',
  'help.guide.files-preview.goal':
    'Bir bilete ya da bir resme yerinde bakın ve gerektiğinde onu kendi makinenize alın.',
  'help.guide.files-preview.step.1':
    'Bir resmin adına ya da küçük önizlemesine tıklayın. Tam ekran açılır, başlıkta dosyanın adı ve resimler arasındaki sırası ile.',
  'help.guide.files-preview.step.2':
    'Yanlardaki yuvarlak oklar, sol ve sağ ok tuşları ve alttaki küçük resim şeridi, listenin o anda gösterdiği her resmin arasında gezer.',
  'help.guide.files-preview.step.3': 'Yeni sekmede aç ve İndir başlıkta durur; × ya da Escape resmi yeniden kapatır.',
  'help.guide.files-preview.step.4':
    'Resim olmayan bir belge bunun yerine sayfanın üstünde bir önizlemede açılır, başlığında aynı iki düğmeyle. Bu, × ile ya da yanına bir tıklamayla kapanır.',
  'help.guide.files-preview.step.5':
    'Satırın sonundaki İndir, önce hiçbir şey açmadan dosyayı doğrudan makinenize kaydeder.',
  'help.guide.files-preview.result':
    'Belge ekrandadır ve aynı iki düğme onu bir tarayıcı sekmesine ya da diskinize koyar.',
  'help.guide.files-preview.tip.1':
    'Dokunmatik ekranda oklara tıklamak yerine resimler arasında parmağınızla kaydırırsınız.',
  'help.guide.files-preview.tip.2':
    'Bir cüzdan kartı hiçbir zaman önizleme açmaz: hemen indirilir, böylece telefon onu cüzdan uygulamasına verebilir.',
  'help.guide.files-preview.tip.3':
    'Yeni sekmede aç ve İndir, dosyayı oturumunuzla getirir, bu yüzden adres çubuğundan kopyalanan bir bağlantı başka kimsenin işine yaramaz.',
  // files-trash
  'help.guide.files-trash.title': 'Bir belgeyi atın ve geri alın',
  'help.guide.files-trash.goal':
    'Gezinin artık ihtiyaç duymadığını temizleyin, sonunda gerçekten gereken hiçbir şeyi kaybetmeden.',
  'help.guide.files-trash.step.1':
    'Satırın sonundaki Sil düğmesine tıklayın. Dosya listeden hemen çıkar ve ileti Çöp kutusuna taşındı der. Önce hiçbir şey sormaz.',
  'help.guide.files-trash.step.2':
    'Araç çubuğunun sağ ucundaki Çöp kutusu listeyi atılanlara çevirir. Başlık Çöp kutusu der ve filtre sekmeleri yoktur.',
  'help.guide.files-trash.step.3':
    'Atılmış bir satır soluklaşır ve iki düğmesi kalır: dosyayı geri getiren Geri yükle ve bir sorudan sonra onu kalıcı olarak kaldıran Sil.',
  'help.guide.files-trash.step.4':
    'Geri yükle düğmesine tıklayın. İleti Dosya geri yüklendi der ve satır, notu ve bağları hâlâ üzerindeyken çöp kutusundan çıkar.',
  'help.guide.files-trash.step.5':
    'Üstteki Çöp kutusunu boşalt, burada duran her şeyi kalıcı olarak temizler ve tarayıcı bunu yapmadan önce bir kez sorar. Çöp kutusu yeniden dosyalara döner.',
  'help.guide.files-trash.result': 'Dosya listede durduğu yere, hiçbir şey olmamış gibi geri döner.',
  'help.guide.files-trash.tip.1':
    'Satırdaki Sil önce sormaz ve çöp kutusu tam da bunun içindir: burada siz söyleyene kadar hiçbir şey TREK’ten çıkmaz.',
  'help.guide.files-trash.tip.2':
    'Bir dosyayı atmak ve geri almak Dosyaları sil hakkını gerektirir. Bu hakkı olmayan bir üye ne satırdaki Sil düğmesini ne de çöp kutusundaki düğmeleri görür.',
  'help.guide.files-trash.tip.3': 'Çöp kutusunda kalıcı olarak silinen bir dosya geri getirilemez.',
  // files-sync
  'help.guide.files-sync.title': 'Belgeleri belge deponuzla eşit tutun',
  'help.guide.files-sync.goal':
    'Geziyi kendi belge deponuza bağlayın, böylece burada yüklenen oraya iner, orada dosyalanan burada belirir.',
  'help.guide.files-sync.step.1':
    'Araç çubuğunun sağ ucunda, Çöp kutusu yanındaki Belge eşitleme düğmesine tıklayın. Pencere, başlığının altında gezinin adıyla açılır. Solda, Sağlayıcı bağla altında, bir yöneticinin açtığı depolar durur, her biri nasıl dosyaladığına dair bir satırla: Paperless-ngx ve Papra etiketlerle, Nextcloud ve Synology Drive bir klasörde, OpenCloud bir alanda. Sağda Henüz bir şey bağlanmadı yazar.',
  'help.guide.files-sync.step.2':
    'Deponuza tıklayın, burada Nextcloud. Bağlantı için depodan adını alan daha küçük bir pencere açılır ve o deponun oturum açmak için istediği bilgileri sorar.',
  'help.guide.files-sync.step.3':
    'Adres alanını ve deponun kendi oturum açma bilgilerini doldurun: Paperless-ngx için bir API belirteci, Papra için bir API anahtarı ve Kuruluş kimliği, Nextcloud için Kullanıcı adı ve bir Uygulama parolası, OpenCloud için Kullanıcı adı ve bir Uygulama belirteci, Synology Drive için de Kullanıcı adı, Parola ve hesap istiyorsa bir İki adımlı doğrulama kodu. Deponun sunduğu her yerde bir uygulama parolası ya da belirteci kullanın, asla hesap parolanızı değil. Nextcloud ve Synology Drive ayrıca isteğe bağlı bir Temel klasör alır; TREK gezi klasörlerini orada arar, burada /Reisen. Alttaki Kendinden imzalı sertifikayı kabul et yalnızca kendi ağınızda böyle bir sertifikası olan bir depo içindir.',
  'help.guide.files-sync.step.4':
    'Bağlantıyı test et düğmesine tıklayın. TREK yazdıklarınızla depoya ulaşır ve alt bilgide hesabın adıyla birlikte Ulaşıldı, … olarak oturum açıldı yazar. Reddedilen kimlik bilgileri ya da ulaşılamayan bir adres bunun yerine orada adlandırılır ve iki durumda da hiçbir şey kaydedilmez.',
  'help.guide.files-sync.step.5':
    'Bağlan düğmesine tıklayın. Bağlantı geziyle birlikte kaydedilir ve TREK gezinin depoda nerede duracağını sorar: belgelerini tutan etiket, klasör ya da alan. Yalnızca oradakiler eşitlenir. Yeni bir tane oluştur, Oluştur ile gezinin başlığından önceden doldurulmuş bir adla onu oluşturur; Ya da var olanlardan birini kullanın altında zaten var olanlar durur. Birine tıklayın, burada Autumn in Japan klasörüne.',
  'help.guide.files-sync.step.6':
    'Pencere geri gelir: deponuz solda Bu gezi altında durur ve sağdaki kartında nereye eşitlendiği, en son ne zaman çalıştığı ve Şimdi eşitle düğmesi yer alır. İlk çalışma kendiliğinden başlar; Şimdi eşitle istediğiniz zaman bir tane çalıştırır. Bir çalışma bittiğinde adın yanındaki Henüz eşitlenmedi rozeti yerini yeşil bir noktaya bırakır, üzerine geldiğinizde Eşit durumda, ve akış çubuğu TREK ile deponun her birinin tuttuğu belgeleri sayar, aralarında Depoya giden ve Depodan gelen şeritleriyle. Pencereyi × ile kapatın.',
  'help.guide.files-sync.result':
    'Orada zaten olan belgeler listenin en üstünde, sizin adınıza yüklenmiş olarak durur ve gezinin her belgesi depoda da vardır. Bundan sonra TREK depoyu arka planda denetler ve depo listeyi izler.',
  'help.guide.files-sync.tip.1':
    'Bir geziyi yalnızca gezinin sahibi ya da bir örnek yöneticisi bağlayabilir, çünkü kimlik bilgileri depodaki o hesabın tamamına ulaşır. Her üye Belge eşitleme’yi açabilir, kartı okuyabilir ve Şimdi eşitle düğmesine basabilir.',
  'help.guide.files-sync.tip.2':
    'Kendi ağınızdaki bir depo TREK sunucusunda ALLOW_INTERNAL_NETWORK=true ister ve adresi makinenin ağdaki adresi olmalıdır, asla localhost değil. Bu olmadan Bağlantıyı test et, Bu adrese izin verilmiyor. yanıtını verir.',
  'help.guide.files-sync.tip.3':
    'Karttaki Bağlantıyı kes eşleştirmeyi bitirir ve her belgeyi iki tarafta da tutar. İkinci kez bağlanan bir etiket, klasör ya da alan yeni sayılır ve içindeki her şey yeniden gelir, bu yüzden bir Bağlantıyı kes sonrasında eskisi yerine boş bir tane bağlayın.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Gün ayrıntıları',
  'help.ctx.trip-day-detail.summary':
    'Bir gün başlığının harita üzerinde açtığı panel: bütün olarak gün, adı ve tarihi, bulunacağınız yerdeki hava, o güne düşen rezervasyonlar ve o gün için ayrılan geceler.',
  'help.ctx.trip-day-detail.bullet.1':
    'Günler sütununda bir günün başlığına tıklayın, panel haritanın ortası üzerinde açılır. Aynı başlık tekrar ya da sağındaki X onu kapatır ve günü bırakır.',
  'help.ctx.trip-day-detail.bullet.2':
    'Başlık günün adını ve tarihini taşır. Adın yanındaki kalem günü yeniden adlandırır, çift ok ucu paneli ince bir çubuğa katlar, böylece harita yeniden serbest kalır.',
  'help.ctx.trip-day-detail.bullet.3':
    'En üstte günün havası. Yer adı için tahmin ifadesi, tahminin hangi yer için olduğunu adlandırır: günün ilk durağı ya da uyandığınız otel.',
  'help.ctx.trip-day-detail.bullet.4':
    'Rezervasyonlar o günün rezervasyonlarını listeler, her birini türü, ait olduğu durağı ve saatleriyle. Yeşil onaylandı demektir, kehribar rengi hâlâ askıda; bu bir okuma listesidir, rezervasyonlar Rezervasyonlar sekmesinde değiştirilir.',
  'help.ctx.trip-day-detail.bullet.5':
    'Konaklama bu güne denk gelen her geceyi gösterir, gerçekleştikleri günlerde Giriş ve Çıkış yapmak ile, giriş aralığı, çıkış saati ve onay koduyla birlikte.',
  'help.ctx.trip-day-detail.bullet.6':
    'Konaklama ekle bu güne bir gece ayırtır: tesisi gezinin yerlerinden seçin, hangi günleri kapsadığını söyleyin, saatleri ve kodu ekleyin.',
  // day-panel
  'help.guide.day-panel.title': 'Bir günü açın ve ayrıntılarını okuyun',
  'help.guide.day-panel.goal':
    'Bir günü bütün olarak, havasını, rezervasyonlarını ve nerede uyuduğunuzu haritadan ayrılmadan görün.',
  'help.guide.day-panel.step.1':
    'Günler sütununda bir günün başlığına tıklayın. Gün seçilir ve ayrıntıları haritanın ortası üzerinde açılır.',
  'help.guide.day-panel.step.2': 'Başlık günü adlandırır, siz bir ad verene kadar 1. gün, altında tarihiyle.',
  'help.guide.day-panel.step.3':
    'En üstte günün havası. Yer adı için tahmin ifadesi, tahminin hangi yer için olduğunu söyler: günün ilk durağı ya da uyandığınız otel.',
  'help.guide.day-panel.step.4': 'Altındaki Rezervasyonlar bu güne düşen rezervasyonları saatleriyle listeler.',
  'help.guide.day-panel.step.5':
    'Konaklama bu güne denk gelen geceleri gösterir, gerçekleştikleri günlerde Giriş ve Çıkış yapmak ile.',
  'help.guide.day-panel.step.6':
    'Başlıktaki çift ok ucu paneli ince bir çubuğa katlar. Yanındaki X paneli kapatır ve günü bırakır.',
  'help.guide.day-panel.result':
    'Çubuğuna katlanmış panel haritayı serbest bırakır ve günü seçili tutar; kapatıldığında gün seçimden çıkar ve plan eskisi gibi olur.',
  'help.guide.day-panel.tip.1':
    'Panelin başlık çubuğunun herhangi bir yerine tıklamak da onu katlar. Ok ucu bunun yalnızca düğmesidir.',
  'help.guide.day-panel.tip.2':
    'Yerler sütunundan bir yer açmak, yerin ayrıntılarını panelin yerine koyar. Onları kapatın, gün geri gelir.',
  // day-weather
  'help.guide.day-weather.title': 'Günün havasını okuyun',
  'help.guide.day-weather.goal': 'O gün gerçekten bulunduğunuz yerde günün nasıl geçeceğini bilin.',
  'help.guide.day-weather.step.1':
    'Yer adı için tahmin ifadesi, sayıların hangi yer için olduğunu adlandırır: günün ilk durağı ya da, durağı olmayan bir günde, uyandığınız otel.',
  'help.guide.day-weather.step.2':
    'Büyük sayı günün sıcaklığıdır, yanında en düşük ve en yüksek değer ve hava durumu sözcüklerle.',
  'help.guide.day-weather.step.3':
    'Altındaki etiketler: yağış olasılığı, ne kadar yağacağı, en güçlü rüzgâr, gün doğumu ve gün batımı.',
  'help.guide.day-weather.step.4':
    'En altta gün saat saat, iki saatte bir: saat, simge, sıcaklık ve yağış olasılığı. Yüzde 50 üzerindeki bir saat maviye boyanır.',
  'help.guide.day-weather.result':
    'Günler sütunundaki günün kartı aynı havayı numarasının altında küçük olarak taşır, böylece bütün gezi tek bakışta okunur.',
  'help.guide.day-weather.tip.1':
    'Dereceler ve rüzgâr Ayarlar’daki Görünüm altındaki Sıcaklık Birimi ayarını izler: °F Fahrenheit seçin, aynı tahmin °F ve mph ile okunur.',
  'help.guide.day-weather.tip.2':
    'Konumlu durağı ve uyanacak oteli olmayan bir gün hiç hava göstermez: tahmin her zaman bir yer içindir, hiçbir zaman gezi için değil.',
  'help.guide.day-weather.tip.3':
    '16 günden daha ileriye alınacak tahmin yoktur. Sayılar o zaman o tarih için önceki yılların ortalamalarıdır, Ø ile işaretlenir ve altında böyle yazar.',
  // rename-day
  'help.guide.rename-day.title': 'Güne bir ad verin',
  'help.guide.rename-day.goal': 'Bir güne 5. gün yerine ne ise onu deyin, Kyoto’ya varış ya da Dinlenme günü.',
  'help.guide.rename-day.step.1': 'Günü açın. Başlığı 5. gün yazar, altında tarihiyle.',
  'help.guide.rename-day.step.2': 'Adın yanındaki kaleme tıklayın.',
  'help.guide.rename-day.step.3': 'Ad bir alana dönüşür. İstediğiniz adı yazın.',
  'help.guide.rename-day.step.4':
    'Enter’a basın ya da başka bir yere tıklayın; Escape değişikliği atar. Günler sütunundaki günün kartı da adı taşır.',
  'help.guide.rename-day.result':
    'Ad panelde ve günler sütunundaki günün kartında 5. gün yerine geçer; tarih olduğu yerde kalır.',
  'help.guide.rename-day.tip.1': 'Alanı boşaltıp kaydedin, gün yeniden 5. gün olur: ad yokken görünen şey numaradır.',
  'help.guide.rename-day.tip.2':
    'Ad güne aittir, tarihine değil. Günleri yeniden sıralayın, o günün diğer her şeyiyle birlikte gider.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Bir güne gece ayırtın',
  'help.guide.add-accommodation.goal': 'Oteli plana bir kez koyun, kapsadığı günler, saatleri ve onay koduyla.',
  'help.guide.add-accommodation.step.1':
    'Tesisin önce gezinin bir yeri olması gerekir. Onu yerler sütununda başka herhangi bir yer gibi oluşturun: seçici yalnızca orada zaten olanı sunar.',
  'help.guide.add-accommodation.step.2': 'Vardığınız günü açın ve Konaklama altında Konaklama ekle düğmesine tıklayın.',
  'help.guide.add-accommodation.step.3':
    'Günlere uygula, konaklamanın hangi geceleri kapsadığını söyler: solda giriş günü, sağda çıkış günü. Tüm bütün geziyi kapsar.',
  'help.guide.add-accommodation.step.4':
    'Giriş, Kadar ve Çıkış yapmak alanlarını doldurun ve rezervasyonun numarasını Onay kodu altına yazın. Dördü de boş kalabilir.',
  'help.guide.add-accommodation.step.5':
    'Tesisi gezinin yerlerinden seçin. Listenin üstündeki etiketler onu tek bir kategoriye daraltır.',
  'help.guide.add-accommodation.step.6': 'Kaydet düğmesine tıklayın.',
  'help.guide.add-accommodation.result':
    'Konaklama kapsadığı her günde görünür, ilkinde Giriş ve sonuncusunda Çıkış yapmak ile. Tesis giriş gününde bir durak olur, böylece harita oraya giden yolu çizer ve Rezervasyonlar sekmesinde Konaklama türünde bir rezervasyon belirir.',
  'help.guide.add-accommodation.tip.1':
    'Seçici geldiğiniz günde açılır, çıkış ertesi günde; kaydetmeden önce ikisi de taşınabilir.',
  'help.guide.add-accommodation.tip.2':
    'Oteli oluştururken ona gezinin Hotel kategorisini verin, listenin üstündeki etiketler onu tek tıkla otellerinize daraltsın.',
  'help.guide.add-accommodation.tip.3':
    'Saatlerin hepsi isteğe bağlıdır: girişi ve kodu olmayan bir konaklama yine gecelerini kapsar ve yine rotasını çizer.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Ayrılmış bir geceyi değiştirin ya da iptal edin',
  'help.guide.edit-accommodation.goal':
    'Bir konaklamayı taşıyın, saatlerini düzeltin ya da onu plandan yeniden çıkarın.',
  'help.guide.edit-accommodation.step.1':
    'Konaklamanın her gününde kart tesisi, giriş aralığını, çıkış saatini ve onay kodunu gösterir.',
  'help.guide.edit-accommodation.step.2':
    'Sağındaki kalem konaklamayı yeniden açar. Pencere artık Konaklamayı düzenle yazar.',
  'help.guide.edit-accommodation.step.3':
    'Alanlar satırını düzeltin: Giriş, Kadar, Çıkış yapmak ve Onay kodu. Üstündeki günler ve altındaki tesis de burada değiştirilebilir.',
  'help.guide.edit-accommodation.step.4': 'Kaydet düğmesine tıklayın.',
  'help.guide.edit-accommodation.step.5':
    'Kalemin yanındaki X konaklamayı bitirir. Hiçbir şey sormaz ve ona ait Konaklama türündeki rezervasyon da onunla gider.',
  'help.guide.edit-accommodation.result':
    'Değişiklik konaklamanın kapsadığı her güne aynı anda ulaşır, Rezervasyonlar sekmesindeki Konaklama türündeki rezervasyona da.',
  'help.guide.edit-accommodation.tip.1':
    'Bir konaklamanın ortasındaki gece ne Giriş ne de Çıkış yapmak etiketini taşır: bunlar yalnızca aralığın ilk ve son gününde olur.',
  'help.guide.edit-accommodation.tip.2':
    'Bir konaklamayı iptal etmek, giriş gününe koyduğu durağı ve rezervasyonuna bağlı her maliyeti de alır. Yanlışlıkla olduysa geceyi yeniden ayırtın.',
  // day-bookings
  'help.guide.day-bookings.title': 'Günün rezervasyonları tek bakışta',
  'help.guide.day-bookings.goal': 'Bu gün için nelerin ayırtıldığını ve onaylı olup olmadığını tek yerde görün.',
  'help.guide.day-bookings.step.1':
    'Rezervasyonlar günün rezervasyonlarını listeler: tarihi o güne düşenleri ve duraklarından birine bağlı olanları.',
  'help.guide.day-bookings.step.2':
    'Bir satır rezervasyonun türünü, adını ve bir durağa ait olduğunda o durağı bir noktadan sonra gösterir. Saatleri sağ uçta durur.',
  'help.guide.day-bookings.step.3':
    'Renk bir rezervasyonun nerede olduğunu söyler: yeşil satır onaylandı, kehribar rengi olan hâlâ askıda. Oteller bu listede değildir, aşağıda kendi blokları vardır.',
  'help.guide.day-bookings.step.4':
    'Liste rezervasyonları yalnızca okur. Bir rezervasyon Rezervasyonlar sekmesinde oluşturulur ve değiştirilir.',
  'help.guide.day-bookings.result':
    'Tarihi o güne düşen her şey ve duraklarından birine bağlı olan her şey bu tek listededir.',
  'help.guide.day-bookings.tip.1':
    'Bir rezervasyon güne kendi tarihiyle iner. Tarihi Rezervasyonlar sekmesinde değiştirin, kendiliğinden diğer güne taşınır.',
  'help.guide.day-bookings.tip.2':
    'Rezervasyonlar bloğunun olmaması, günün rezervasyonu olmadığı anlamına gelir: boş gösterilmek yerine gizlenir.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Harita',
  'help.ctx.trip-map.summary':
    'Planın ortası: gezinin her yeri bir iğne, onları birleştiren rotalar ve haritanın kenarları boyunca uydu için, tüm gezi için ve baktığınız şehir parçasının çevresindeki yerler için anahtarlar.',
  'help.ctx.trip-map.bullet.1':
    'Bir iğne bir yerdir: varsa kendi fotoğrafı, yoksa kategori rengi ve kategori simgesi. İmleci bir iğnenin üzerine getirin, adını ve adresini taşıyan bir kart gelir, yerin taşıdığı yerlerde kategorisi ve puanıyla birlikte. Yeri o güne planlamak için bir iğneyi gün kartının üzerine sürükleyin.',
  'help.ctx.trip-map.bullet.2':
    'Birbirinden ayırt edilemeyecek kadar yakın duran iğneler, sayıyı taşıyan tek bir koyu baloncukta toplanır. Baloncuğa tıklayın, harita içindekine yakınlaşır.',
  'help.ctx.trip-map.bullet.3':
    'Yeri haritanın altında açmak için bir iğneye tıklayın: puanı, dosyaları ve onunla sırada ne yapacağınız oradadır; bırakmak için haritanın boş bir parçasına tıklayın.',
  'help.ctx.trip-map.bullet.4':
    'Günler sütununda bir gün açıkken, o günün durakları o gündeki sıra numarasını taşıyan küçük beyaz bir rozet taşır ve iki güne planlanmış bir yer, · ile birleştirilmiş iki numarayı birden taşır.',
  'help.ctx.trip-map.bullet.5':
    'Üstteki simge sırası haritanın gördüğünüz parçasında arar: Restoranlar, Kafeler, Bar ve gece hayatı, Konaklama, Gezilecek yerler, Müzeler ve kültür, Doğa ve parklar ile Aktiviteler. Bu alanda ara, haritayı oynattıktan sonra aramayı yeniden çalıştırır.',
  'help.ctx.trip-map.bullet.6':
    'Haritanın herhangi bir yerine sağ tıklayarak o noktada yer formunu açın, adres çoktan bulunmuş olur. Sol alttaki yuvarlak düğme çizilmiş haritayı hava görüntüleriyle değiştirir.',
  'help.ctx.trip-map.bullet.7':
    'Sağ alttaki Tüm geziyi göster her seyahat gününü aynı anda çizer ve her birinin neyi kapsadığını listeler; bir rezervasyonun satırındaki rota simgesi o rezervasyonu çizer, günlerin üstündeki araç çubuğundaki ise hepsini çizer.',
  // map-markers
  'help.guide.map-markers.title': 'Haritayı okuyun',
  'help.guide.map-markers.goal': 'Haritadaki her iğnenin, rozetin ve baloncuğun size ne söylediğini bilin.',
  'help.guide.map-markers.step.1':
    'Harita gezinin her yerini tutar. İğnelerin birbirinden ayırt edilemeyecek kadar yakın durduğu yerde, içlerindeki sayıyı taşıyan tek bir koyu baloncukta toplanırlar; baloncuğa tıklayın, harita içinde olana yakınlaşır ya da en derin yakınlaştırmada iğneleri yelpaze gibi açar.',
  'help.guide.map-markers.step.2':
    'Bir iğne, varsa yerin kendi fotoğrafıdır, yoksa kategori rengi ve kategori simgesidir. İmleci üzerine getirin, bir kart adını ve adresini verir, yerin taşıdığı yerlerde kategorisi ve puanıyla birlikte.',
  'help.guide.map-markers.step.3':
    'Bir iğneye tıklayın, yer haritanın altındaki bir kartta açılır: koordinatları, puanı, Dosyalar ve alt kenar boyunca onunla sonra ne yapacağınız, aralarında Navigasyon, Düzenle ve Sil, bir gün açıkken de Güne Ekle. Bırakmak için haritanın boş bir parçasına tıklayın.',
  'help.guide.map-markers.step.4':
    'Günler sütununda bir gün açın, durakları numaralanır: iğnenin köşesindeki küçük beyaz rozet o durağın gündeki sırasıdır. İki güne planlanmış bir yer, · ile birleştirilmiş iki numarayı birden taşır. Açık bir gün yokken numara olmaz ve köşe onun yerine puanı taşır.',
  'help.guide.map-markers.step.5':
    'Bir iğneyi haritadan günler sütunundaki bir gün kartının üzerine sürükleyin, yer o güne planlanır, tıpkı satırını yerler listesinden sürüklemek gibi.',
  'help.guide.map-markers.result':
    'Gezide hiçbir şey değişmedi: harita onun bir görünümüdür ve her iğne hangi yer olduğunu, hangi güne ait olduğunu ve hangi sırada geldiğini söyler.',
  'help.guide.map-markers.tip.1':
    'Günler sütununda kapatılmış bir gün, duraklarını haritadan da alıp götürür; günü yeniden açın, geri gelirler.',
  'help.guide.map-markers.tip.2':
    'Yerler listesinin üstündeki filtre haritanın ne çizeceğine de karar verir: Planlanmamış’ı seçin, haritada yalnızca hâlâ günü olmayan yerler kalır.',
  'help.guide.map-markers.tip.3':
    'Bu haritada yakınlaştırma düğmeleri yoktur: tekerlek yakınlaştırır, çift tıklama bir adım yakınlaştırır ve haritanın kendisini sürüklemek onu taşır.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Haritada çevrenizdeki yerleri bulun',
  'help.guide.map-nearby-places.goal':
    'Haritanın baktığınız şehir parçasında restoran, gezilecek yer ya da otel aramasını sağlayın ve birini geziye alın.',
  'help.guide.map-nearby-places.step.1':
    'Haritanın üstündeki simge sırası kategori aramasıdır: Restoranlar, Kafeler, Bar ve gece hayatı, Konaklama, Gezilecek yerler, Müzeler ve kültür, Doğa ve parklar ile Aktiviteler.',
  'help.guide.map-nearby-places.step.2':
    'Bir kategoriye tıklayın. TREK, haritanın gördüğünüz parçasında o tür yeri arar ve her sonuç için kategorinin renginde bir iğne bırakır. Aynı anda tek kategori: başkasına tıklamak onu değiştirir, açık olana tıklamak onu kapatır.',
  'help.guide.map-nearby-places.step.3':
    'Haritayı oynatın, sıranın altında ikinci bir düğme belirir: Bu alanda ara aynı aramayı yeni görünüm için çalıştırır. Yalnızca oynatmak asla yeniden aramaz, bu da istek sayısını düşük tutar.',
  'help.guide.map-nearby-places.step.4':
    'İğneler buldukları şeyin adını taşır. Birine tıklayın, yer formu ondan doldurulmuş olarak açılır: İsim, Adres, Enlem ve Boylam ile OpenStreetMap’te varsa web sitesi ve telefon numarası.',
  'help.guide.map-nearby-places.step.5':
    'Neyi doldurduğunu kontrol edin ve aramanın bilemeyeceğini ekleyin: bir Tanım, bir Kategori, kendi notlarınız.',
  'help.guide.map-nearby-places.step.6':
    'Ekle düğmesine tıklayın. Aynı adlı bir yer gezide zaten varsa form bunu söyler ve düğme Yine de ekle olur.',
  'help.guide.map-nearby-places.result':
    'Yer, yerler listesinde ve haritada gezinin kendi iğnelerinden biri olarak durur, bir güne koyana kadar Planlanmamış altında. Arama iğneleri, kategoriyi kapatana kadar kalır.',
  'help.guide.map-nearby-places.tip.1':
    'Ayarlar içinde, Travel & map altında Haritada yerleri keşfet kapalıysa sıra görünmez.',
  'help.guide.map-nearby-places.tip.2':
    'Yanıtlar TREK Places dizininden ve OpenStreetMap’ten gelir, yani bu, plandaki bağlantı gerektiren birkaç şeyden biridir.',
  'help.guide.map-nearby-places.tip.3':
    'Bir arama ekranda olanı kapsar, bu yüzden sorduğunuz sokağa yakınlaşın: bütün bir şehir ilk altmış sonuçla ve aralarında pek az düzenle yanıt verir.',
  // map-add-place
  'help.guide.map-add-place.title': 'Haritaya sağ tıklayarak yer oluşturun',
  'help.guide.map-add-place.goal': 'Bir yeri önce aramadan, tam istediğiniz noktaya koyun.',
  'help.guide.map-add-place.step.1':
    'Haritada kastettiğiniz noktaya sağ tıklayın. Yer formu Yer/etkinlik Ekle başlığıyla açılır.',
  'help.guide.map-add-place.step.2':
    'Enlem ve Boylam zaten o noktadadır ve TREK koordinatları arayıp orada bulduğundan Adres alanını, aramanın verecek bir adı olduğu yerde de İsim alanını doldurur. Henüz hiçbir şey yazılmadı, yanlış olanın üzerine yazın.',
  'help.guide.map-add-place.step.3':
    'Ona tanıyacağınız bir İsim verin ve planın bilmesi gereken geri kalanı: Tanım, Notlar, Kategori, Web sitesi.',
  'help.guide.map-add-place.step.4':
    'Ekle düğmesine tıklayın. Bir gün açık olsa bile yer listeye planlanmamış olarak iner: haritaya sağ tıklamak nerede olduğunu söyler, ne zaman olduğunu değil.',
  'help.guide.map-add-place.result': 'Yer listede ve haritadadır, bir güne koyana kadar Planlanmamış altında.',
  'help.guide.map-add-place.tip.1':
    'Adres, koordinatların aranmasından gelir, bu yüzden bir addan çok sokak gibi okunabilir ve açık arazide boş dönebilir. İki alan da sizindir, üzerlerine yazın.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL ve Mapbox GL haritalarında orta tıklama da aynısını yapar, dokunmatik ekranda ise uzun basma.',
  // map-satellite
  'help.guide.map-satellite.title': 'Uyduya geçin',
  'help.guide.map-satellite.goal': 'Çizilmiş haritayı hava görüntüleriyle değiştirin ve geri alın.',
  'help.guide.map-satellite.step.1':
    'Haritanın sol alt köşesindeki yuvarlak düğme temel katman anahtarıdır. Simgesi her zaman geçeceği katmanı gösterir, üzerine gelmek hangisi olduğunu söyler: Uydu görünümüne geç. Tıklayın.',
  'help.guide.map-satellite.step.2':
    'Harita artık hava görüntüsü, tek bir binayı ayırt edebileceğiniz kadar derin ve kendi anahtarınız olmadan. TREK’in çizdiği her şey üstte kalır: iğneler, günün rotası, izler ve rezervasyon rotaları.',
  'help.guide.map-satellite.step.3': 'Düğmede artık Harita görünümüne geç yazar. Çizili haritaya dönmek için tıklayın.',
  'help.guide.map-satellite.result': 'Harita yeniden çizilir ve onu bıraktığınız katman hesabınızda hatırlanır.',
  'help.guide.map-satellite.tip.1':
    'Seçim gezide değil hesabınızda tutulur, bu yüzden hangi çizim motorunu kullanırsanız kullanın her gezi bıraktığınız gibi açılır.',
  'help.guide.map-satellite.tip.2':
    'Görüntüler yazı taşımaz: sokak adları, semtler ve kapı numaraları çizilmiş haritadadır, bu yüzden bir adres ararken geri geçin.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Tüm geziyi ve mesafelerini görün',
  'help.guide.map-whole-trip.goal':
    'Açık olan tek günü gezinin bütün seyahat günleriyle değiştirin ve her birinin ne kadar gittiğini okuyun.',
  'help.guide.map-whole-trip.step.1':
    'Yuvarlak Tüm geziyi göster düğmesi haritanın sağ alt köşesinde durur. Tıklayın, gezinin her seyahat günü aynı anda çizilir, her biri beyaz bir kılıf üzerinde kendi renginde, böylece komşu günler ayrı kalır.',
  'help.guide.map-whole-trip.step.2':
    'Düğmenin üstündeki kart o günleri listeler: bir renk noktası, günün adı, onu kat ettiğiniz her ulaşım biçimi için bir simge ve kapsadığı mesafe. Toplam mesafe en üstte.',
  'help.guide.map-whole-trip.step.3':
    'Kartta bir güne tıklayıp onu seçin, günler sütununda seçmekle aynıdır: harita o günü çerçeveler ve durakları numaralarını geri alır.',
  'help.guide.map-whole-trip.step.4': 'Düğmede artık Tüm geziyi gizle yazar. Açık olan tek güne dönmek için basın.',
  'help.guide.map-whole-trip.result':
    'Her seyahat günü kendi renginde çizilir ve kart her birinin neyi kapsadığını ve gezinin toplamda ne ettiğini söyler.',
  'help.guide.map-whole-trip.tip.1':
    'Toplam birkaç etap birden gelir. Ardında bir … dururken sayı hâlâ kısmi bir toplamdır; her etap yanıt verdiğinde oturur.',
  'help.guide.map-whole-trip.tip.2':
    'Rota motorunun reddettiği bir etap düz çizgi olarak kalır ve hiçbir şey saymaz, kart da sessizce düşük göstermek yerine bunu söyler.',
  'help.guide.map-whole-trip.tip.3':
    'İki taneden az konumlu durağı olan bir günün çizecek rotası yoktur, bu yüzden karttan tamamen çıkarılır.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Bir rezervasyonun rotasını haritada gösterin',
  'help.guide.map-booking-routes.goal':
    'Rezerve ettiğiniz uçuşları, trenleri ve sürüşleri haritada çizin ve yeniden kaldırın.',
  'help.guide.map-booking-routes.step.1':
    'Rezervasyon rotaları, siz isteyene kadar kapalıdır. Günler sütununda bir rezervasyonun satırında küçük bir rota simgesi durur: Rezervasyon rotalarını göster.',
  'help.guide.map-booking-routes.step.2':
    'Tıklayın, rezervasyon haritada belirir: bir uçuş büyük daire yayı olarak, bir sürüş gerçek yollar boyunca, bir tren istasyonlarının zinciri olarak. Onaylandı düz çizgiyle, Beklemede kesik çizgiyle çizilir ve rotanın uçları ulaşım simgesini taşıyan mavi haplardır.',
  'help.guide.map-booking-routes.step.3':
    'Bir uç hapa tıklayın, arkasındaki rezervasyon açılır: saatleri, Rezervasyon Kodu ve başladığı Konum / Adres. Kapat onu yeniden kaldırır.',
  'help.guide.map-booking-routes.step.4':
    'Günlerin üstündeki araç çubuğundaki rota simgesi tüm geziyi aynı anda yapar: Tüm rezervasyon rotalarını göster, rotası olan her rezervasyonu çizer.',
  'help.guide.map-booking-routes.step.5':
    'Bu, üste eklenen bir katman değil temiz bir sayfadır, bu yüzden rezervasyon rezervasyon seçtikleriniz düşer. Yeniden basın, artık Tüm rezervasyon rotalarını gizle yazar ve harita temizdir.',
  'help.guide.map-booking-routes.result':
    'İstediğiniz rezervasyonlar haritada çizilir ve seçim, siz değiştirene kadar bu gezi için bu tarayıcıda tutulur.',
  'help.guide.map-booking-routes.tip.1':
    'Uçlar havalimanı kodunu ya da istasyonun adını yalnızca Ayarlar içinde, Travel & map altında Rezervasyon rota etiketleri açıkken taşır; aksi hâlde yalnızca simgeyi gösterir.',
  'help.guide.map-booking-routes.tip.2':
    'Aynı ayarlardaki Rezervasyon rotalarını her zaman göster, hakkında henüz karar vermediğiniz her gezide onları en baştan çizer.',
  'help.guide.map-booking-routes.tip.3':
    'Bir rezervasyonun çizilebilmesi için koordinatlı iki uca ihtiyacı vardır, bu yüzden bir otel ya da bir restoran rota simgesi taşımaz.',
  'help.ctx.trip-map.bullet.8':
    'Dawarich eklentisi açıkken Tüm geziyi göster altındaki yuvarlak Dawarich düğmesi telefonunuzun gerçekten kaydettiği rotayı çizer: Kaydedilen rotayı göster onu planlanan rotanın altına kesikli olarak, her gün bir renkte serer ve çizgi olmadığında düğmenin etiketi neden olmadığını söyler.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Gerçekten gittiğiniz rotayı gösterin',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich’in telefonunuzda kaydettiği rotayı haritaya, planladığınızın yanına kesikli olarak serin ve geziyi gün gün gerçekte nasıl geçtiyse öyle okuyun.',
  'help.guide.map-dawarich-trail.step.1':
    'Yuvarlak Dawarich düğmesi haritanın sağ altında, Tüm geziyi göster altında durur; üzerine gelmek Kaydedilen rotayı göster der. Tıklayın. TREK, Dawarich’inize gezinin tarihlerini sorar ve yanıt yoldayken düğmenin çevresinde bir halka döner.',
  'help.guide.map-dawarich-trail.step.2':
    'Kaydedilen rota her gün bir renkte kesikli bir çizgi olarak iner, plan okunabilir kalsın diye planlanan rotanın altına çizilir. Düğmede artık Kaydedilen rotayı gizle yazar. Günler yerel gece yarısında kesilir ve günler sütununda kapatılmış bir gün kesikli çizgisini duraklarıyla birlikte haritadan alır.',
  'help.guide.map-dawarich-trail.step.3':
    'Tüm geziyi göster düğmesine de tıklayın, her planlanan gün kesikli kaydın yanında düz çizilir. İkisinin birlikte gittiği yerde gün planlandığı gibi geçmiştir; kesikli çizginin saptığı yer geçmediği yerdir.',
  'help.guide.map-dawarich-trail.result':
    'Planladığınız ile gerçekte yaptığınız haritada birliktedir, kesikliye karşı düz, ve düğmelerin üstündeki kart hâlâ planlanan günleri ve mesafelerini listeler.',
  'help.guide.map-dawarich-trail.tip.1':
    'Açık ya da kapalı olduğu bu tarayıcı oturumu için gezi başına hatırlanır. Rota açıkken TREK her iki dakikada bir Dawarich’e yeniden sorar, böylece süren bir gezi yeniden yükleme olmadan yetişir; rotanın kendisi asla saklanmaz, yani TREK’in veritabanında, yedeklerde ve çevrimdışıyken yoktur.',
  'help.guide.map-dawarich-trail.tip.2':
    'Düğmenin etiketi boş bir haritayı açıklar: yoldayken Kaydedilen rota yükleniyor…, Bu tarihlerde hiçbir şey kaydedilmemiş, Kaydedilen rota yüklenemedi ya da TREK çevrimdışıyken Kaydedilen rota için bağlantı gerekir.',
  // map-compass
  'help.guide.map-compass.title': 'Haritayı döndürün ve kuzeyi yeniden bulun',
  'help.guide.map-compass.goal':
    'Haritayı gittiğiniz yöne bakacak şekilde döndürün ve tek tıklamayla kuzeye geri oturtun.',
  'help.guide.map-compass.step.1':
    'Haritayı sağ tuşla sürükleyerek ya da Ctrl basılı tutup sol tuşla sürükleyerek döndürün; dokunmatik ekranda iki parmakla çevirin. Haritanın üstündeki kategori simgeleri sırasının yanındaki yuvarlak pusula onunla döner: oku her zaman kuzeyi gösterir, bu yüzden ne kadar döndürdüyseniz o kadar yatar.',
  'help.guide.map-compass.step.2':
    'Pusulaya tıklayın. Düğmenin adı olan Reset north haritayı yumuşakça üstte kuzeye ve düz görünüme geri getirir, ok yeniden dik durur.',
  'help.guide.map-compass.result':
    'Harita yeniden kuzey üstte ve düzdür, gezide hiçbir şey değişmemiştir: pusula yalnızca kamerayı oynatır.',
  'help.guide.map-compass.tip.1':
    'Pusula yalnızca MapLibre GL ve Mapbox GL haritalarında vardır; Leaflet haritası döndürülemez, bu yüzden pusulası yoktur. Ayarlar içinde Harita altındaki Harita Sağlayıcısı hangisini kullandığınıza karar verir ve Haritayı Kaydet seçimi tutar.',
  'help.guide.map-compass.tip.2':
    'Tıklama eğimi de alır: sağ tuşla yukarı ya da aşağı sürüklemek görünümü eğer ve Reset north dönüşle birlikte onu da düzler. 3D Binalar ve Arazi açıkken Mapbox GL üzerinde bu, yeniden eğene kadar 3D görünümü de düzleştirir.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'İş birliği',
  'help.ctx.trip-collab.summary':
    'Grubun birlikte planladığı sekme: solda sohbet, yanında ortak notlar ve bağlantılar, onların altında anketler ve en sonda What’s Next. Buraya yazılan her şey, sayfa yeniden yüklenmeden, aynı anda diğer her üyenin ekranında durur.',
  'help.ctx.trip-collab.bullet.1':
    'Sohbet soldaki sütundur. Mesaj yazın... kutusuna yazın ve Enter’a basın; Shift ve Enter yeni bir satır açar. Gülen yüz emoji ekler, Görsel ekle mesaja dört taneye kadar resim iliştirir.',
  'help.ctx.trip-collab.bullet.2':
    'Yanıtla için bir mesajın üzerine gelin, kendi mesajınızda yanında Sil de çıkar; sekiz hızlı tepki için mesaja sağ tıklayın. Silinen bir mesajdan geriye, bir mesajı sildiğinizi söyleyen tek bir satır kalır.',
  'help.ctx.trip-collab.bullet.3':
    'Notlar ortak bloknottur: Yeni Not bir tane yazar, yanındaki dişli ise adları ve renkleri için Kategorileri Yönet penceresini açar. Bir kart Genişlet, Sabitle, Düzenle ve Sil taşır.',
  'help.ctx.trip-collab.bullet.4':
    'Bağlantılar gezinin üzerinde yürüdüğü adresleri toplar. Bağlantı ekle bir başlık ve bir http ya da https adresi alır; Bağlantıyı düzenle, Bağlantıyı sabitle ve Bağlantıyı sil etiketin kuyruğunda oturur, sabitlenen bağlantılar ise en önde kalır.',
  'help.ctx.trip-collab.bullet.5':
    'Anketler işleri karara bağlar. Yeni Anket en az iki seçenekli bir soru sorar; bir seçeneğe tıklamak sizin oyunuzdur, Kapat oylamayı bitirir ve Sil anketi kaldırır.',
  'help.ctx.trip-collab.bullet.6':
    'What’s Next gezinin hâlâ önde duran duraklarını, en fazla sekiz tanesini, saatleri ve üzerlerindeki kişilerle birlikte listeler. Yalnızca gün planını okur; saatler orada ayarlanır.',
  // write-note
  'help.guide.write-note.title': 'Ortak bir not yazın',
  'help.guide.write-note.goal':
    'Bütün grubun ihtiyaç duyduğu şeyi, bir kuralı, bir adresi, bir hatırlatmayı, herkesin yeniden bulacağı yere koyun.',
  'help.guide.write-note.step.1': 'Notlar panelinin üstündeki Yeni Not düğmesine tıklayın. Form açılır.',
  'help.guide.write-note.step.2':
    'Not başlığı kartın taşıdığı addır. Formun ısrar ettiği tek şey odur: içinde bir şey olana kadar Oluştur gri kalır.',
  'help.guide.write-note.step.3':
    'Altındaki büyük kutu metni tutar ve Markdown alır: kalın bir kelime, bir liste, bir başlık. Kart ilk birkaç satırı gösterir, üzerindeki Genişlet ise notun tamamını açar.',
  'help.guide.write-note.step.4':
    'Kategori altında notun ait olduğu kategoriyi seçin; onun rengi kartın rengi olur. Haplar zaten var olan kategorilerdir, yenisi ise Kategorileri Yönet altında yapılır.',
  'help.guide.write-note.step.5': 'Web sitesi nota ait bir bağlantı alır. Kart o zaman onu açan bir Link karosu taşır.',
  'help.guide.write-note.step.6': 'Oluştur düğmesine tıklayın.',
  'help.guide.write-note.result':
    'Not, Notlar panelinde kendi kategorisinin renginde bir karttır ve şimdiden diğer her üyenin ekranındadır.',
  'help.guide.write-note.tip.1':
    'Bir karttaki Sabitle onu panelin en üstünde tutar; altındaki her şey en son ne zaman değiştirildiğine göre sıralanır.',
  'help.guide.write-note.tip.2':
    'Yeni Not yanındaki dişli Kategorileri Yönet penceresini açar: orada bir kategori rengini alır, bir kerede her yerde yeniden adlandırılır ya da herhangi bir not onu kullanmadan önce eklenir.',
  'help.guide.write-note.tip.3':
    'Dosya ekle nota bir belge iliştirir. Ekle dosya seçiciyi açar, bir görsel ya da bir PDF ise forma yapıştırılabilir de.',
  'help.guide.write-note.tip.4':
    'Notlar, Eklentiler altında, İş birliği bölümünde kendi anahtarına sahiptir: bir yönetici onu kapatıp sohbeti, bağlantıları, anketleri ve What’s Next bölümünü çalışır bırakabilir.',
  // shared-links
  'help.guide.shared-links.title': 'Gezinin bağlantılarını toplayın',
  'help.guide.shared-links.goal':
    'Rezervasyon portalını, ortak albümü ve tarifeyi sohbeti kaydırarak aramak yerine tek bir yerde tutun.',
  'help.guide.shared-links.step.1': 'Bağlantılar panelinin üstündeki Bağlantı ekle düğmesine tıklayın.',
  'help.guide.shared-links.step.2':
    'Bağlantı başlığı alanında bağlantıya bir ad verin, adresi altındaki alana yapıştırın, sonra Bağlantıyı kaydet düğmesine tıklayın.',
  'help.guide.shared-links.step.3':
    'Etiket adı ve işaret ettiği siteyi gösterir. Üzerine tıklamak sayfayı yeni bir sekmede açar.',
  'help.guide.shared-links.step.4':
    'Kuyruğundaki üç küçük düğme Bağlantıyı düzenle, Bağlantıyı sabitle ve Bağlantıyı sil düğmeleridir. Bağlantıyı sabitle etiketi panelin en önüne taşır; Bağlantıyı sil hiçbir şey sormaz.',
  'help.guide.shared-links.result':
    'Bağlantı, Bağlantılar panelinde en öne sabitlenmiş bir etikettir ve aynı anda her üyenin ekranındadır.',
  'help.guide.shared-links.tip.1':
    'Yalnızca http ve https adresleri alınır; alan, kaydetmeden önce başka her şeyi reddeder.',
  'help.guide.shared-links.tip.2':
    'Önce sabitlenen bağlantılar gelir, sonra en yenileri. Bir başlığın yanındaki küçük simge sitenin kendi faviconudur, sitenin kendisinden alınır, bu yüzden internet yokken etiket onun yerine düz bir bağlantı işareti gösterir.',
  'help.guide.shared-links.tip.3':
    'Bağlantılar, Eklentiler altında, İş birliği bölümünde kendi anahtarına sahiptir, böylece bir yönetici sekmenin geri kalanına dokunmadan paneli kapatabilir.',
  // create-poll
  'help.guide.create-poll.title': 'Gruba sorun',
  'help.guide.create-poll.goal':
    'Sohbette kimsenin yanıtlamadığı bir soruyu, herkesin işaretleyebileceği bir ankete dönüştürün.',
  'help.guide.create-poll.step.1': 'Anketler panelinin üstündeki Yeni Anket düğmesine tıklayın.',
  'help.guide.create-poll.step.2':
    'Soruyu yazın. Kutunun altındaki Markdown desteklenir, kalın bir kelimenin, bir satır sonunun ya da kısa bir listenin burada işe yaradığı anlamına gelir.',
  'help.guide.create-poll.step.3':
    'Seçenek 1 ve Seçenek 2 alanlarını doldurun. İçinde bir şey olan iki seçenek en alt sınırdır.',
  'help.guide.create-poll.step.4':
    '+ Seçenek ekle üçüncüyü, dördüncüyü, ihtiyacınız kadarını ekler; bir satırın yanındaki küçük çarpı birini geri alır.',
  'help.guide.create-poll.step.5':
    'Çoklu seçim herkesin birden fazla seçeneği işaretlemesine izin verir. Kapalı bırakıldığında, biri başka bir şey seçince oyu oraya kayar.',
  'help.guide.create-poll.step.6': 'Anket Oluştur düğmesine tıklayın.',
  'help.guide.create-poll.result':
    'Anket, Anketler panelinin en üstünde, açık ve henüz kimse oy vermemiş olarak durur.',
  'help.guide.create-poll.tip.1': 'Soru Markdown olarak işlenir; seçenekler düz metin kalır.',
  'help.guide.create-poll.tip.2':
    'Bir soru ve içinde bir şey olan en az iki seçenek olana kadar Anket Oluştur gri kalır.',
  'help.guide.create-poll.tip.3':
    'Son tarih yalnızca telefon uygulamasında ayarlanabilir. Son tarihi olan bir anket burada kalan süreyi kehribar renkli bir etikette gösterir ve süre dolunca kapalı sayılır.',
  'help.guide.create-poll.tip.4':
    'Anketler, Eklentiler altında, İş birliği bölümünde kendi anahtarına sahiptir: bir yönetici onu kapatıp diğer dört paneli çalışır bırakabilir.',
  // vote-poll
  'help.guide.vote-poll.title': 'Oy verin ve sonucu okuyun',
  'help.guide.vote-poll.goal': 'Oyunuzu verin, grubun nerede durduğunu görün ve fikrinizi değiştirin.',
  'help.guide.vote-poll.step.1': 'İstediğiniz seçeneğe tıklayın. Dairesi dolar ve arkasındaki çubuk büyür.',
  'help.guide.vote-poll.step.2':
    'Artık sonucun tamamı okunur: çubuk paydır, yüzde sağda durur ve küçük daireler o seçeneği seçen kişilerdir.',
  'help.guide.vote-poll.step.3':
    'Fikriniz mi değişti? Başka bir seçeneğe tıklayın. Çoklu seçim olmayan bir ankette oyunuz ikinci bir oy eklemek yerine oraya kayar.',
  'help.guide.vote-poll.step.4':
    'Sorunun altında anketin kaç oyu olduğu durur. Zaten seçtiğiniz seçeneğe tıklamak oyunuzu geri çeker ve sayaç yeniden düşer.',
  'help.guide.vote-poll.result':
    'İşaretiniz bir seçenekte durur, çubuklar grubun nasıl bölündüğünü gösterir ve daireler kimin neyi seçtiğini söyler.',
  'help.guide.vote-poll.tip.1':
    'Çubuklar ve yüzdeler ancak siz kendiniz oy verdikten sonra ya da anket kapandıktan sonra görünür, böylece kimse duruma bakıp yönlendirilmez.',
  'help.guide.vote-poll.tip.2':
    'Bir oy asla gizli değildir: arkasındaki adı görmek için bir seçenekteki dairelerden birinin üzerine gelin.',
  // close-poll
  'help.guide.close-poll.title': 'Bir anketi kapatın ya da kaldırın',
  'help.guide.close-poll.goal':
    'Grup karar verdikten sonra oylamayı durdurun ve artık kimsenin ihtiyaç duymadığı bir anketi temizleyin.',
  'help.guide.close-poll.step.1':
    'Bir anketin köşesindeki kilit olan Kapat, oylamayı bitirir. Seçenekler tıklama almayı bırakır.',
  'help.guide.close-poll.step.2':
    'Kapatılan bir anket panelin altındaki Kapalı başlığının altına iner, bir Kapalı rozeti taşır ve oy versinler ya da vermesinler sonucu herkese gösterir. Kazanan seçenek yeşile boyanır.',
  'help.guide.close-poll.step.3':
    'Aynı köşedeki çöp kutusu olan Sil, anketi kaldırır. Hiçbir şey iki kez sormaz ve oylar da onunla birlikte gider.',
  'help.guide.close-poll.result':
    'Anket her üyenin panelinden gitmiştir. Yalnızca kapattığınız bir anket ise sonucuyla birlikte altta okunur durumda kalır.',
  'help.guide.close-poll.tip.1':
    'Kapatmak geri alınamaz: yeniden açmak yoktur. Yanlışlıkla kapatılan bir anketin yeniden sorulması gerekir.',
  'help.guide.close-poll.tip.2': 'Sil, anketi ve üzerindeki her oyu herkes için, hemen ve soru sormadan kaldırır.',
  // whats-next
  'help.guide.whats-next.title': 'What’s Next bölümünü okuyun',
  'help.guide.whats-next.goal': 'Planı açmadan grubun sırada ne yaptığını görün.',
  'help.guide.whats-next.step.1':
    'Panel, gezinin hâlâ önde duran duraklarını, en fazla sekiz tanesini, zaman sırasıyla, her gün için bir başlık altında listeler: Bugün, Yarın ya da tarih.',
  'help.guide.whats-next.step.2':
    'Bir satırın solunda saati durur: başlangıç, aradaki ayraç ve durağın varsa bitiş saati, ya da üzerinde henüz saat ayarlanmamışsa TBD.',
  'help.guide.whats-next.step.3':
    'Adın altındaki etiketler o duraktaki kişilerdir. Onun için kimse seçilmemişse gezideki herkes listelenir.',
  'help.guide.whats-next.result':
    'Gelecek olanların yalnızca okunacak bir listesi: planı izler ve buradaki hiçbir şey onu değiştirmez.',
  'help.guide.whats-next.tip.1':
    'Burada hiçbir şey ayarlanmaz. Saatler gün planından gelir; onları orada değiştirin, bu liste hemen ardından gelir.',
  'help.guide.whats-next.tip.2':
    'Yalnızca hâlâ önde duranlar listelenir: saati geçmiş bir durak listeden düşer ve bir gezinin sonunda panel boştur.',
  'help.guide.whats-next.tip.3':
    'What’s Next, Eklentiler altında, İş birliği bölümünde kendi anahtarına sahiptir ve bir masaüstü panelidir: telefon uygulamasının İş birliği sekmesi onu sunmaz.',
  // trip-chat
  'help.guide.trip-chat.title': 'Grupla konuşun',
  'help.guide.trip-chat.goal':
    'Bir şey söyleyin, belirli bir mesajı yanıtlayın, bir başkasına tepki verin ve kendi mesajınızı geri alın.',
  'help.guide.trip-chat.step.1':
    'Mesaj yazın... kutusuna yazın ve Enter’a basın. Kutunun yanındaki mavi ok da aynısını yapar; Shift ve Enter ise bunun yerine yeni bir satır açar.',
  'help.guide.trip-chat.step.2':
    'Gülen yüz, içinde Smileys, Reactions ve Travel bulunan emoji seçiciyi açar. Seçtiğiniz şey yazmakta olduğunuza eklenir, kendi başına gönderilmez.',
  'help.guide.trip-chat.step.3':
    'Başka birinin mesajının üzerine gelin: köşesinde küçük yuvarlak bir düğme belirir. O, Yanıtla düğmesidir.',
  'help.guide.trip-chat.step.4':
    'Yanıtladığınız mesaj kutunun üstünde alıntılanır. Yazıp gönderin, alıntı da baloncuğunuzun içinde birlikte gider; alıntının üzerindeki çarpı onu yeniden bırakır.',
  'help.guide.trip-chat.step.5':
    'Sekiz hızlı tepki için bir mesaja sağ tıklayın. Sizinki baloncuğun altında oturur, aynısına ikinci kez tıklamak onu geri alır.',
  'help.guide.trip-chat.step.6':
    'Kendi mesajlarınız Yanıtla yanında Sil de taşır. Mesajı kaldırır ve bir mesajı sildiğinizi söyleyen tek bir satır bırakır: geri dönüş yoktur.',
  'help.guide.trip-chat.result':
    'Yanıtınız alıntıladığı mesajın altında oturur, bir tepki üçüncü bir mesajda asılı durur ve geri aldığınız mesaj bunu söyleyen tek bir satır bırakır.',
  'help.guide.trip-chat.tip.1':
    'Enter gönderir, Shift ve Enter yeni bir satır açar. Emojiden başka bir şey içermeyen bir mesaj büyük gösterilir.',
  'help.guide.trip-chat.tip.2':
    'Görsel ekle bir mesaj için dört taneye kadar resim alır; bunlar ayrıca yapıştırılabilir ya da kutunun üzerine bırakılabilir.',
  'help.guide.trip-chat.tip.3':
    'İçinde bağlantı olan bir mesaj, altında kendi TREK’inizin getirdiği bir önizleme kartı alır, bu yüzden yalnızca sizin erişebildiğiniz bir şeye giden bağlantı düz bir bağlantı olarak kalır.',
  'help.guide.trip-chat.tip.4':
    'Sohbet, Eklentiler altında, İş birliği bölümünde kendi anahtarına sahiptir: bir yönetici onu kapatıp notları, bağlantıları, anketleri ve What’s Next bölümünü çalışır bırakabilir.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listeler',
  'help.ctx.trip-lists.summary':
    'Bir gezi için iki liste: kimin neyi getirdiğini ve ne kadar ağır olduğunu tutan paket listesi ve gezi öncesinde ve sırasında olması gereken her şeyin yapılacaklar listesi. Listeler eklentisi açık olduğu sürece sekme oradadır.',
  'help.ctx.trip-lists.bullet.1':
    'Üstteki Paket Listesi ve Yapılacaklar ikisi arasında geçiş yapar ve her birinde ne olduğunu sayar; sağdaki düğmeler hangisi açıksa ona aittir.',
  'help.ctx.trip-lists.bullet.2':
    'Paket listesi listelere ayrılmıştır, Belgeler, Giysi, siz onlara ne ad verirseniz, her biri renkli bir nokta, paketlenen bölü toplam rozeti ve Yeniden adlandır, Tümünü İşaretle, Tüm işaretleri kaldır ve Listeyi sil barındıran üç nokta ile. Yukarıdaki çubuktaki Liste ekle yenisini oluşturur.',
  'help.ctx.trip-lists.bullet.3':
    'Bir satır bir onay kutusu ve bir addır, sonra küçük rozetler olarak onu kimin getireceği, adet ve gram cinsinden ağırlık ve Çanta Takibi açıkken bir çanta dairesi, sonra çöp kutusu ve Listeye taşı, Paylaşım, Yeniden adlandır ve Sil barındıran üç nokta. Bir satırın kullanmadığı şeyler üzerine gelene kadar soluk kalır ve soldaki tutamak satırı kendi listesi içinde yukarı ya da aşağı sürükler.',
  'help.ctx.trip-lists.bullet.4':
    'Ortak ve Listem paket listesini ikiye böler: herkesin gördüğü havuz ve sizin kendi listeniz. Tüm, Açık ve Tamamlamak hangisi açıksa onu daraltır ve üstteki çubuk neyin paketlendiğini sayar.',
  'help.ctx.trip-lists.bullet.5':
    'Şablon uygula ve Şablon olarak kaydet bir listeyi yazmadan doldurur ya da saklar, yanlarındaki iki simge ise listeyi çıktı, PDF ya da dosya olarak dışa aktarır ve bir liste içe aktarır. İlerleme çubuğunun yanındaki kırmızı düğme kaç öğenin işaretli olduğunu söyler ve onları temizler.',
  'help.ctx.trip-lists.bullet.6':
    'Yapılacaklar kendi kenar çubuğuna sahiptir: ilerleme kartı, Tümü, Görevlerim, Gecikmiş ve Tamamlandı filtreleri, liste başına bir satır ve bunların altında Liste ekle. Görevler bir kartın içindedir; kartın başlığında filtrenin adı ve sıralama, yani Öncelik ya da Son tarih, yer alır. Bir göreve tıklamak onu sağdaki bölmede açar, Yeni görev ekle ise ekranın ortasında Yeni görev formunu açar.',
  // packing-categories
  'help.guide.packing-categories.title': 'Paket listesini kurun',
  'help.guide.packing-categories.goal':
    'Götürdüklerinizi listeler halinde gruplayın, onları öğelerle doldurun ve her listeyle kimin ilgilendiğini söyleyin.',
  'help.guide.packing-categories.step.1':
    'Listelerin üstündeki çubukta Liste ekle düğmesine tıklayın, adı Liste adı (ör. Giysi) alanına yazın ve Ekle düğmesine tıklayın.',
  'help.guide.packing-categories.step.2':
    'Yeni liste bir boş satırla başlar. Öğe ekle düğmesine tıklayın, öğeyi Öğe adı... alanına yazın ve Enter tuşuna basın; alan bir sonraki için açık kalır.',
  'help.guide.packing-categories.step.3':
    'Bir satırı adına tıklayarak ya da sağ ucundaki üç noktadaki Yeniden adlandır ile yeniden adlandırın.',
  'help.guide.packing-categories.step.4':
    'Liste başlığındaki kesik çizgili daire geziye katılan üyeleri listeye atar. Bir ad seçin; beliren etiket tek tıkla o kişiyi yine çıkarır.',
  'help.guide.packing-categories.step.5':
    'Başlığın sonundaki üç nokta gerisini barındırır: Yeniden adlandır, Tümünü İşaretle, Tüm işaretleri kaldır ve Listeyi sil, ki bu listeyi ve içindeki her şeyi bir daha sormadan alır.',
  'help.guide.packing-categories.result':
    'Yeni liste ızgarada, öğeleri altında ve renkli noktasıyla oturur ve rozeti şimdiden neyin paketlendiğini sayar.',
  'help.guide.packing-categories.tip.1':
    'Bir liste yalnızca kendi öğeleridir. Sonuncusunu silin, satır bir yer tutucuya döner, böylece liste yerini ve rengini korur; o satırı da silin, liste gider.',
  'help.guide.packing-categories.tip.2':
    'Birini bir listeye atamak ona bir paketleme bildirimi gönderir. Öğeleri kimin görebildiğini değiştirmez, onu bir satırın üç noktasındaki Paylaşım yapar.',
  'help.guide.packing-categories.tip.3':
    'İki liste aynı adı taşıyabilir. TREK onları içeride ayrı tutar, böylece adlar yazdığınız gibi kalır.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Paketlerken işaretleyin',
  'help.guide.check-off-packing.goal':
    'Çantada ne olduğunu işaretleyin, çubuğu izleyin ve paketlenmiş öğeleri temizleyin.',
  'help.guide.check-off-packing.step.1':
    'Bir satırın solundaki kutuya tıklayın. Adın üstü çizilir ve çubuk hareket eder.',
  'help.guide.check-off-packing.step.2':
    'Üstteki çubuk paketleneni listedeki her şeye karşı sayar, hem sayı hem yüzde olarak.',
  'help.guide.check-off-packing.step.3':
    'Bütün bir liste birden: başlığındaki üç nokta Tümünü İşaretle ve Tüm işaretleri kaldır seçeneklerini barındırır.',
  'help.guide.check-off-packing.step.4':
    'Tüm, Açık ve Tamamlamak ızgarayı daraltır. Açık yalnızca hâlâ eksik olanı bırakır, bu yüzden tamamen paketlenmiş bir liste onun dışında kalır.',
  'help.guide.check-off-packing.step.5':
    'İlerleme çubuğunun yanındaki 3 İşaretli öğeyi kaldır, tarayıcıdan bir onay sonrasında işaretli her öğeyi bir kerede siler.',
  'help.guide.check-off-packing.result':
    'Yalnızca hâlâ açık olan listelenir ve üstteki çubuk paketlemenin ne kadar ilerlediğini söyler.',
  'help.guide.check-off-packing.tip.1': 'İşaretli bir öğe yine de yeniden adlandırılabilir: adına tıklayın.',
  'help.guide.check-off-packing.tip.2':
    'Tümünü İşaretle ve Tüm işaretleri kaldır her seferinde tek bir listede, o listenin kendi üç noktasından çalışır.',
  'help.guide.check-off-packing.tip.3':
    'Her öğe işaretlendiğinde sayacın yerini Hepsi paketlendi! alır ve çubuk yeşile döner.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Bir paket şablonu uygulayın',
  'help.guide.apply-packing-template.goal':
    'Hazır bir listeyi geziye getirin ve bu gezinin listesini bir sonraki için saklayın.',
  'help.guide.apply-packing-template.step.1': 'Listenin üstündeki çubukta Şablon uygula düğmesine tıklayın.',
  'help.guide.apply-packing-template.step.2': 'Bir şablon seçin. Her satır onu adlandırır ve kaç öğe tuttuğunu söyler.',
  'help.guide.apply-packing-template.step.3':
    'Öğeler bulunduğunuz görünüme iner: Ortak onları herkesin gördüğü havuza koyar, Listem onları sizin yapar.',
  'help.guide.apply-packing-template.step.4':
    'Bu gezinin listesini bir sonraki gezi için saklayın: Şablon olarak kaydet bir iletişim kutusu açar, bir ad yazın ve Kaydet düğmesine tıklayın.',
  'help.guide.apply-packing-template.result': 'Şablonun listeleri ve öğeleri gezidedir, zaten orada olanın yanında.',
  'help.guide.apply-packing-template.tip.1':
    'Bir şablon yalnızca adları ve listeleri taşır. Adetler, ağırlıklar, çantalar ve şimdiden işaretli olanlar geride kalır.',
  'help.guide.apply-packing-template.tip.2':
    'Şablon uygula yalnızca bir şablon var olduğunda oradadır. Şablon yoksa düğme hiç görünmez.',
  'help.guide.apply-packing-template.tip.3':
    'Şablon olarak kaydet yalnızca bir örnek yöneticisine ve yalnızca listede öğe varken görünür. Ortak havuzu ve kendi öğelerinizi kaydeder, başka bir üyenin özel öğelerini asla.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Bütün bir paket listesini yapıştırın',
  'help.guide.import-packing-list.goal':
    'Başka bir yerde zaten var olan bir listeyi tek seferde paket öğelerine çevirin.',
  'help.guide.import-packing-list.step.1': 'Listenin üstündeki çubukta aşağı oklu içe aktarma düğmesine tıklayın.',
  'help.guide.import-packing-list.step.2':
    'Satır başına bir öğe: Kategori, Ad, g cinsinden ağırlık (isteğe bağlı), Çanta (isteğe bağlı), checked/unchecked (isteğe bağlı). Kutudaki gri örnek dört biçimi de gösterir. Markdown listesi de olur: başlık listeye adını verir, "- [ ]" ve "- [x]" ise öğeye dönüşür.',
  'help.guide.import-packing-list.step.3':
    'Ya da satırları CSV/TXT/MD Yükle ile bir dosyadan yükleyin. Bir .csv, bir .txt ya da bir .md alır ve kutuda ne varsa onun yerini alır.',
  'help.guide.import-packing-list.step.4': 'İçe aktar düğmesine tıklayın. Düğme anladığı satırları sayar.',
  'help.guide.import-packing-list.result':
    'Her satır bir öğedir, ilk alanının adlandırdığı listede, ve zaten orada olan hiçbir şeye dokunulmaz.',
  'help.guide.import-packing-list.tip.1':
    'Alanları virgüller, noktalı virgüller ve sekmeler ayırır, çift tırnaklar ise bir alanı bir arada tutar, böylece “Gömlek, mavi” tek bir ad olarak kalır. Tek değerli bir satır sadece bir addır, kendi listesi olmayan bir satır Diğer içine iner ve bir adın önündeki "3x" adedi belirler.',
  'help.guide.import-packing-list.tip.2':
    'Dördüncü alanda adı geçen bir çanta, gezide henüz yoksa oluşturulur. Ağırlıkları ve çantaları toplu yükleyen tek yer burasıdır; bir şablon yalnızca adları ve listeleri getirir.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Paket listesini yazdırın veya dışa aktarın',
  'help.guide.export-packing-list.goal':
    'Listeyi kâğıt üzerinde, PDF olarak ya da başka bir uygulama veya sonraki gezi için dosya olarak yanınıza alın.',
  'help.guide.export-packing-list.step.1': 'Listenin üstündeki çubukta yukarı oklu dışa aktarma düğmesine tıklayın.',
  'help.guide.export-packing-list.step.2':
    'Markdown kontrol listesi (.md) ve İçe aktarma için CSV (.csv) listeyi hemen dosya olarak kaydeder.',
  'help.guide.export-packing-list.step.3':
    'Yazdır veya PDF olarak kaydet seçeneğine tıklayın. Önizleme listeyi bir sayfa olarak gösterir: üstte gezi ve tarihleri, ardından her liste işaretlenecek bir kutuyla birlikte bir kart olarak.',
  'help.guide.export-packing-list.step.4':
    'Önizlemenin altındaki Yazdır veya PDF olarak kaydet düğmesine tıklayın. Tarayıcı kendi yazdırma penceresini açar: bir yazıcı seçin ya da dosya olarak saklamak için PDF olarak kaydet seçeneğini seçin.',
  'help.guide.export-packing-list.result':
    'Çıktı ve dosyalar açık olan görünümü, Ortak ya da Listem, adetler, ağırlıklar ve işaretlerle birlikte içerir.',
  'help.guide.export-packing-list.tip.1':
    'CSV, İçe aktar özelliğinin okuduğu biçimdir, çantalar dahil, bu yüzden size ait bir paket şablonu gibi çalışır: onu sonraki geziye içe aktarın.',
  'help.guide.export-packing-list.tip.2':
    'Markdown dosyası Obsidian, Notion veya GitHub içinde bir kontrol listesi olarak açılır ve İçe aktar ile aynı şekilde geri gelir.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Bir öğeyi kimin göreceğine ve kimin getireceğine karar verin',
  'help.guide.share-packing-item.goal':
    'Bir öğeyi grup havuzu, kendi listeniz ve onu kendileri için getirdiğiniz kişiler arasında taşıyın.',
  'help.guide.share-packing-item.step.1':
    'Listelerin üstündeki Ortak herkesin gördüğü havuzdur, Listem sizin kendinizinkidir ve her biri içindekileri sayar. Kendinizinkine bakmak için Listem seçeneğine tıklayın.',
  'help.guide.share-packing-item.step.2':
    'Ortak içine dönüp bir satırın sonundaki üç noktayı açın ve Paylaşım seçeneğine tıklayın.',
  'help.guide.share-packing-item.step.3':
    'Üç katman: Ortak, grup havuzunda ve herkese görünür; Kişisel, yalnızca sizin gördüğünüz; ve Şu kişilerle paylaş…, burada öğenin kapsadığı kişileri seçersiniz.',
  'help.guide.share-packing-item.step.4': 'Kişisel bir öğe yalnızca Listem içindedir. Onu bulmak için geçiş yapın.',
  'help.guide.share-packing-item.step.5':
    'Paylaşım seçeneğini yeniden açın ve Şu kişilerle paylaş… altında bir adı işaretleyin. Öğe o kişinin listesinde de görünür ve satır, kaç kişiyle paylaşıldığını sayan küçük bir rozet alır.',
  'help.guide.share-packing-item.result': 'Öğe seçtiğiniz katmanda durur ve satır onu kimin getirdiğini söyler.',
  'help.guide.share-packing-item.tip.1':
    'Bir öğenin paylaşımını yalnızca onu getiren kişi değiştirir. Paylaştığınız kişi onu kendi Listem görünümünde, adınızla işaretli olarak görür ve işaretleyebilir.',
  'help.guide.share-packing-item.tip.2':
    'Başkasının getirdiği bir öğede bunun yerine iki başka düğme alırsınız: Ben de getirebilirim, sizi onun yanına ekler, ve Listeme kopyala, size ait özel bir kopya oluşturur.',
  'help.guide.share-packing-item.tip.3':
    'Yeni öğeler onları eklediğiniz görünümü devralır. Listem içinde eklenenler Kişisel olur, Ortak içinde eklenenler havuza gider.',
  // packing-bags
  'help.guide.packing-bags.title': 'Çantaları tartın',
  'help.guide.packing-bags.goal':
    'Her öğeye bir ağırlık verin, öğeleri çantalara ayırın ve her çantayı havayolunun limitinin altında tutun.',
  'help.guide.packing-bags.step.1':
    'Dairenin önündeki ağırlık rozetine tıklayın ve öğenin ağırlığını gram olarak yazın.',
  'help.guide.packing-bags.step.2': 'Satırın sonundaki daire onun çantasıdır. Ona tıklayın.',
  'help.guide.packing-bags.step.3':
    'Henüz çanta yok: Çanta ekle, bir ad, Enter. Çanta oluşturulur ve öğe doğrudan içine girer.',
  'help.guide.packing-bags.step.4':
    'Bir çanta var olur olmaz sağda Çantalar paneli belirir: ad, ağırlık, bir doluluk çubuğu, onu kimin taşıdığı ve içinde kaç öğe olduğu, sonra Atanmamış ve Toplam ağırlık.',
  'help.guide.packing-bags.step.5':
    'Limit belirle düğmesine tıklayın ve limiti havayollarının belirttiği gibi kilogram olarak yazın.',
  'help.guide.packing-bags.step.6': 'Bir çantanın adının yanındaki kesik çizgili artı onu kimin taşıdığını söyler.',
  'help.guide.packing-bags.result':
    'Sağdaki Çantalar paneli her çantanın ağırlığını limitine karşı, hiçbir çantada olmayanı ve toplamı gösterir.',
  'help.guide.packing-bags.tip.1':
    'Ağırlık alanı, çanta dairesi ve Çantalar paneli yalnızca bir yönetici Listeler eklentisi altında Çanta Takibi seçeneğini açık tuttuğu sürece vardır.',
  'help.guide.packing-bags.tip.2':
    'Bir çantanın ağırlığı sunucuda her üyenin öğeleri üzerinden, göremedikleriniz dahil, toplanır, bu yüzden sayı gerçekten çantanın ağırlığıdır.',
  'help.guide.packing-bags.tip.3':
    'Limiti olmayan bir çanta en ağır çantaya karşı çizilir, böylece çubuklar karşılaştırılabilir kalır. Ona bir limit verin, çubuk bunun yerine ona göre okunur.',
  // create-todo
  'help.guide.create-todo.title': 'Bir görev ekleyin',
  'help.guide.create-todo.goal':
    'Olması gereken bir şeyi, bir liste, bir öncelik, bir tarih ve bir adla birlikte yazın.',
  'help.guide.create-todo.step.1': 'Sağ üstteki Yeni görev ekle düğmesine tıklayın.',
  'help.guide.create-todo.step.2':
    'Görev adı alanında ona bir ad verin ve hatırlanmaya değer ne varsa Açıklama altına koyun.',
  'help.guide.create-todo.step.3':
    'Liste görevi gruplar. Birini seçin ya da yanındaki artıyı kullanarak küçük bir iletişim kutusunda yenisine ad verin.',
  'help.guide.create-todo.step.4': 'Öncelik dört düğmedir: Yok, P1, P2 ve P3, kırmızıdan maviye.',
  'help.guide.create-todo.step.5': 'Son tarih bir takvim açar, Atanan ise göreve bir ad koyar.',
  'help.guide.create-todo.step.6': 'Görev oluştur düğmesine tıklayın.',
  'help.guide.create-todo.result':
    'Görev listededir, rozetleriyle, önceliğiyle, son tarihiyle, listesiyle ve atandığı kişiyle, ve sağdaki bölmede açılır.',
  'help.guide.create-todo.tip.1':
    'Yalnızca ad zorunludur. Geri kalan her şey sonradan sağdaki bölmeden doldurulabilir.',
  'help.guide.create-todo.tip.2': 'Kenar çubuğunda bir liste seçiliyken, yeni bir görev o listede başlar.',
  'help.guide.create-todo.tip.3': 'Ad alanında Enter, diğer alanlara dokunmadan görevi hemen oluşturur.',
  // todo-filters
  'help.guide.todo-filters.title': 'Bir görevi bulun ve değiştirin',
  'help.guide.todo-filters.goal':
    'Görev listesini şimdi önemli olana indirin, sonra denk geldiğiniz görevi düzenleyin.',
  'help.guide.todo-filters.step.1':
    'Kenar çubuğundaki Görevler: Tümü hâlâ açık olan her şeydir, Görevlerim size düşenler, Gecikmiş tarihi geçmişte kalanlar, Tamamlandı bitmiş olanlar. Her biri kendi sayısını taşır; Gecikmiş üzerine tıklayın.',
  'help.guide.todo-filters.step.2':
    'Listeler altında liste başına bir satır oturur. Birini seçmek o listeyi, bitmiş görevler dahil, gösterir.',
  'help.guide.todo-filters.step.3':
    'Listenin başlığındaki sıralama ekrandakinin sırasını değiştirir: Öncelik P1 olanları öne alır, Son tarih en yakın tarihi öne alır. Aynı anda yalnızca ikisinden biri, ikinci bir tıklama ise sizin kendi sıranıza geri döner.',
  'help.guide.todo-filters.step.4': 'Sağdaki bölmede açmak için bir göreve tıklayın.',
  'help.guide.todo-filters.step.5':
    'Neyi gerekiyorsa değiştirin, Açıklama, Öncelik, Liste, Son tarih ya da Atanan, sonra Değişiklikleri kaydet. Bölmenin başlığındaki kutu görevi tamamlandı olarak işaretler, Sil ise onu hemen alır götürür.',
  'help.guide.todo-filters.result':
    'Liste yalnızca istediğiniz görevleri gösterir ve sağdaki bölme seçtiğinizi düzenler.',
  'help.guide.todo-filters.tip.1':
    'Bir liste satırı yalnızca hâlâ açık olanı sayar, ama onu seçmek bitmiş görevleri de gösterir. Tümü, Görevlerim ve Gecikmiş bitmiş olanı gizler; Tamamlandı başka bir şey göstermez.',
  'help.guide.todo-filters.tip.2':
    'Sıralamadaki Öncelik ve Son tarih birbirini dışlar ve ikisinden biri açıkken satırlar artık kendi istediğiniz bir sıraya sürüklenemez.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Rezervasyonlar',
  'help.ctx.trip-bookings.summary':
    'Gezi için ayırtılmış olan ve bir ulaşım yolu olmayan her şeyi tutan sekme: konaklamalar, masalar, biletler, turlar, otopark. Her rezervasyon Askıda olması ya da Onaylandı bölümünde bir karttır ve kendi kodunu, belgesini, yolcularını ve maliyetini taşır.',
  'help.ctx.trip-bookings.bullet.1':
    'Sağ üstteki Manuel Rezervasyon formu açar. Yaptığı altı tür Konaklama, Restoran, Etkinlik, Tur, Otopark ve Diğer; uçuşlar, trenler ve geri kalanı Ulaşım sekmesinde yaşar ve burada asla görünmez.',
  'help.ctx.trip-bookings.bullet.2':
    'Dosyadan içe aktar bir onayı ayrıştırıcıya verir: EML, PDF, PKPass, HTML ya da TXT, en fazla 10 MB olan beş dosya. Düğme yalnızca sunucu bunları okuyabildiğinde oradadır.',
  'help.ctx.trip-bookings.bullet.3':
    'Başlığın yanındaki rozetler türe göre filtreler, her biri kendi sayısıyla, ve Tümü her şeyi geri getirir. Bir rezervasyon kişileri adlandırdığında, rozetlerin yanındaki avatar sırası sekmeyi onlardan birine daraltır.',
  'help.ctx.trip-bookings.bullet.4':
    'Kartlar iki bölümde durur, Askıda olması ve Onaylandı, her biri kendi sayısıyla. Bir bölüm başlığına tıklamak onu katlar ve açık olup olmadığını TREK bu gezi için hatırlar.',
  'help.ctx.trip-bookings.bullet.5':
    'Bir kart durum noktasını, türü, başlığı, tarihleri ve saatleri, Rezervasyon Kodunu, Konum / Adres bilgisini, rezervasyonun neye bağlı olduğunu, Bağlantısını, Notlarını, Dosyalarını ve Yolcularını taşır.',
  'help.ctx.trip-bookings.bullet.6':
    'Karttaki kalem aynı formu yeniden açar; çöp kutusu bir kez sorar ve sonra rezervasyon gitmiştir. Bir konaklamada gün planındaki geceleri ve bağlı gideri de onunla birlikte gider.',
  // create-booking
  'help.guide.create-booking.title': 'Bir rezervasyon oluşturun',
  'help.guide.create-booking.goal':
    'Bir restoranı, bir etkinliği, bir turu, bir otopark yerini ya da başka herhangi bir şeyi geziye elle koyun.',
  'help.guide.create-booking.step.1':
    'Sekmenin sağ üstündeki Manuel Rezervasyon düğmesine tıklayın. Yeni Rezervasyon açılır.',
  'help.guide.create-booking.step.2':
    'Formun üstündeki listeden, Yolcular alanının yanında Rezervasyon Türü seçin. Konaklama, Restoran, Etkinlik, Tur, Otopark ve Diğer bu sekmenin yaptığı altı türdür ve form seçimle birlikte değişir: yalnızca Konaklama tarihlerini bir gün aralığıyla değiştirir.',
  'help.guide.create-booking.step.3':
    'Başlık yazın. Formun ısrar ettiği tek alan budur ve içinde bir şey olana kadar Ekle ölü kalır.',
  'help.guide.create-booking.step.4':
    'Tarih ve Başlangıç zamanını, rezervasyonun bir sonu varsa Bitiş tarihi ile Bitiş zamanını da ayarlayın. Takvimler yalnızca gezinin içindeki günleri sunar ve başlangıçtan sonra olmayan bir bitiş bunu kırmızıyla söyler ve Ekle düğmesini engeller.',
  'help.guide.create-booking.step.5':
    'Onaydan gelen Rezervasyon Kodunu girin ve Durum ayarlayın. Askıda olması ya da Onaylandı kartın iki bölümden hangisine düşeceğine karar verir.',
  'help.guide.create-booking.step.6': 'Ekle düğmesine tıklayın.',
  'help.guide.create-booking.result':
    'Rezervasyon kendi bölümünde tür rozetiyle, tarihleriyle ve koduyla bir karttır ve gezideki herkes onun belirdiğini görür.',
  'help.guide.create-booking.tip.1':
    'Konum / Adres siz yazarken gerçek adresler sunar; birini seçmek yazdığınızın yerine geçer, kendi yazdığınız bir adres ise olduğu gibi kalır.',
  'help.guide.create-booking.tip.2':
    'Bağlantı rezervasyonun sağlayıcıdaki kendi sayfasına götürür. Kart onu yeni bir sekmede açılan bir bağlantıya çevirir.',
  'help.guide.create-booking.tip.3':
    'Notlar Markdown biçimindedir, bu yüzden bir liste ya da kalın bir satır kartta liste ya da kalın satır olarak görünür.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Bir konaklama yeri ayırtın',
  'help.guide.booking-hotel.goal':
    'Bir konaklamayı, hem bir rezervasyon hem de gün planındaki geceler olarak aynı anda sayılacak şekilde girin.',
  'help.guide.booking-hotel.step.1':
    'Manuel Rezervasyon düğmesine tıklayın ve Konaklama seçin. Tarih alanları gider ve yerlerini bir otel alanları bloğu alır.',
  'help.guide.booking-hotel.step.2':
    'Oteli Konaklama altında seçin. Liste gezinin kendi yerleridir ve birini seçmek adını Başlık alanına, adresini de Konum / Adres alanına yazar.',
  'help.guide.booking-hotel.step.3':
    'İtibaren ve İle alanlarını ayarlayın: ilk gece ve ayrıldığınız sabah. İkisi de gezinin günlerini tarihleriyle sunar ve ikisi birbirini sırada tutar.',
  'help.guide.booking-hotel.step.4':
    'Giriş, Giriş tarihi şu tarihe kadar ve Çıkış yapmak alanlarını, bir de onaydan gelen Rezervasyon Kodunu doldurun.',
  'help.guide.booking-hotel.step.5': 'Ekle düğmesine tıklayın.',
  'help.guide.booking-hotel.result':
    'Kart bir tarih yerine bir gün aralığı taşır, giriş ve çıkış saatleri ile adresiyle birlikte, ve aynı konaklama artık planın o günlerinde oturur.',
  'help.guide.booking-hotel.tip.1':
    'Konaklama, Tarih ve Başlangıç zamanı olmayan tek türdür. Tarihleri İtibaren ve İle alanlarıdır ve bunlar bir takvim değil, gezinin günleridir.',
  'help.guide.booking-hotel.tip.2':
    'Konaklama alanını boş bırakın ve onun yerine adresi yazın: yer sizin için aranır, oluşturulur ve haritaya iğnelenir.',
  'help.guide.booking-hotel.tip.3': 'Rezervasyonu silmek geceleri de gün planından birlikte alıp götürür.',
  // link-booking
  'help.guide.link-booking.title': 'Bir rezervasyonu plana bağlayın',
  'help.guide.link-booking.goal':
    'Bir rezervasyonu ait olduğu durağa ve yere asın, böylece onu isteyeceğiniz yerde karşınıza çıksın.',
  'help.guide.link-booking.step.1': 'Bağlamak istediğiniz karttaki kaleme tıklayın. Rezervasyonu Düzenle açılır.',
  'help.guide.link-booking.step.2':
    'Gün atamasına bağla alanını açın. Liste sizin planınızdır: her gün için bir başlık, sonra o günün numaralanmış ve saatleriyle duran durakları. Rezervasyonun ait olduğunu seçin.',
  'help.guide.link-booking.step.3':
    'Yer / Etkinlik yerin kendisini bağlar. Onu orada seçin, Başlık ve Konum / Adres boş bıraktığınız her yerde dolar.',
  'help.guide.link-booking.step.4': 'Güncelle düğmesine tıklayın.',
  'help.guide.link-booking.result':
    'Kart günü ve durağı Gün atamasına bağla altında adlandırır ve rezervasyon gün planında o durakla birlikte yol alır.',
  'help.guide.link-booking.tip.1':
    'Listenin üstündeki Bağlantı yok (bağımsız) bağlantıyı yeniden kaldırır. Konaklamanın hiç durak seçicisi yoktur: o, geceleri üzerinden bağlanır.',
  'help.guide.link-booking.tip.2':
    'Tarihi olan bir günde bir durak seçmek boş bir Tarih alanını sizin için doldurur. Zaten koyduğunuz bir tarihe dokunulmaz.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Bir rezervasyonun kim için olduğunu söyleyin',
  'help.guide.booking-travelers.goal':
    'Bir rezervasyonun kapsadığı yolcuları işaretleyin ve sonra yalnızca onlarınkini görün.',
  'help.guide.booking-travelers.step.1':
    'Rezervasyonu kalemle açın. Yolcular formun üstünde, Rezervasyon Türü alanının yanında durur ve rezervasyonda kimse yokken Yolcu ata yazar.',
  'help.guide.booking-travelers.step.2':
    'Ona tıklayın ve bu rezervasyonun kimler için olduğunu seçin; adı verilmiş misafirler de listededir. Seçilen bir onay işareti alır ve avatarı alanda görünür. Kaldırmak için ada yeniden tıklayın.',
  'help.guide.booking-travelers.step.3': 'Güncelle düğmesine tıklayın.',
  'help.guide.booking-travelers.step.4':
    'Yukarıda araç çubuğunda, tür rozetlerinin yanında, yalnızca o kişinin rezervasyonlarını görmek için bir yolcunun avatarına tıklayın.',
  'help.guide.booking-travelers.result':
    'Kart kimler için olduğunu listeler ve avatar sırası sekmeyi onlardan birine daraltır.',
  'help.guide.booking-travelers.tip.1':
    'Kartta yolcular yalnızca gösterilir, asla değiştirilmez. Burada, formda ayarlanırlar.',
  'help.guide.booking-travelers.tip.2':
    'Avatar sırası, gezinin birden fazla üyesi olduğunda ve en az bir rezervasyon birini adlandırdığında belirir. Seçtiğiniz şey bu tarayıcı oturumu boyunca kalır.',
  // booking-files
  'help.guide.booking-files.title': 'Voucher belgesini rezervasyonun yanında tutun',
  'help.guide.booking-files.goal': 'Onayı, bileti ya da geçiş kartını ait olduğu rezervasyona ekleyin.',
  'help.guide.booking-files.step.1':
    'Rezervasyonu kalemle açın, Dosyalar alanına inin ve Dosya ekle düğmesine tıklayın. Zaten var olan bir rezervasyonda belge hemen yüklenir ve TREK Dosya yüklendi der.',
  'help.guide.booking-files.step.2': 'Belge adıyla listelenir, onu açan bir düğme ve yanında bir X ile birlikte.',
  'help.guide.booking-files.step.3':
    'Mevcut dosyayı bağla, gezinin henüz bu rezervasyonda olmayan belgelerini sunar. Birini seçin, hiçbir şey yeniden yüklenmeden eklenir.',
  'help.guide.booking-files.step.4': 'Güncelle düğmesine tıklayın.',
  'help.guide.booking-files.result': 'Kart belgeleri Dosyalar altında listeler ve birine tıklamak onu açar.',
  'help.guide.booking-files.tip.1':
    'Henüz oluşturmakta olduğunuz bir rezervasyonda belge bekler ve Ekle düğmesine tıkladığınız anda yüklenir.',
  'help.guide.booking-files.tip.2':
    'Bir belgenin yanındaki X bağı kaldırır, belgeyi değil. Belge gezinin Dosyalar sekmesinde kalır.',
  'help.guide.booking-files.tip.3':
    'Hangi tür dosyaların eklenebileceği yöneticinin listesidir; belgeler, metin ve resimler kutudan çıktığı gibi izinlidir.',
  // booking-cost
  'help.guide.booking-cost.title': 'Bir rezervasyonun fiyatını bir maliyete çevirin',
  'help.guide.booking-cost.goal':
    'Bir rezervasyonun tuttuğu parayı, onu ödeyen kişiler arasında bölünmüş olarak Maliyetler bölümüne taşıyın.',
  'help.guide.booking-cost.step.1':
    'Rezervasyonu açın ve formun en altına inin. Maliyetler altında Harcama oluştur ve Mevcut harcamayı bağla durur, Rezervasyonu kaydeder, sonra masraf düzenleyicisini açar notuyla birlikte.',
  'help.guide.booking-cost.step.2':
    'Harcama oluştur düğmesine tıklayın. Rezervasyon kaydedilir, formu kapanır ve maliyet düzenleyicisi açılır.',
  'help.guide.booking-cost.step.3':
    'Ne içindi? alanı zaten rezervasyonun başlığıdır. Toplam tutar girin ve Para birimi ile Gün alanlarını denetleyin.',
  'help.guide.booking-cost.step.4':
    'Kategori, rezervasyon türünün işaret ettiği kategoridir. Kim ödedi? alanını ve tutarın nasıl bölündüğünü ayarlayın.',
  'help.guide.booking-cost.step.5': 'Harcama ekle düğmesine tıklayın.',
  'help.guide.booking-cost.result':
    'Rezervasyonun formu artık harcamayı tutarıyla birlikte Bağlı harcamalar altında listeler ve aynı harcama bu rezervasyona bağlı olarak Maliyetler sekmesinde durur.',
  'help.guide.booking-cost.tip.1':
    'Kategori türü izler: Restoran Yiyecek & içecek olur, Konaklama Konaklama olur, Otopark Otopark olur, Etkinlik ile Tur ise ikisi de Diğer içine düşer.',
  'help.guide.booking-cost.tip.2':
    'Bir rezervasyon birden çok harcama taşıyabilir. Mevcut harcamayı bağla, Maliyetler içinde henüz hiçbir yere ait olmayanları sunar. Bağlı bir harcamada Bağlantıyı kaldır, harcamayı tut onu serbest bırakır ve Maliyetler içinde tutar, çöp kutusu ise onu kaldırır.',
  'help.guide.booking-cost.tip.3':
    'Maliyetler formda yalnızca Maliyetler eklentisi açıkken bulunur, onu da yönetici Eklentiler altından açıp kapatır.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Bir rezervasyon bulun',
  'help.guide.filter-bookings.goal': 'Uzun bir sekmeyi aradığınız türe, kişiye ya da duruma daraltın.',
  'help.guide.filter-bookings.step.1':
    'Başlığın yanındaki rozetler bu gezinin gerçekten kullandığı türlerdir, her biri tuttuğu sayıyla. Tümü, sekmenin tamamıdır.',
  'help.guide.filter-bookings.step.2':
    'Yalnızca o türü tutmak için bir rozete tıklayın. İkinciye tıklayın, ikisi birden tutulur.',
  'help.guide.filter-bookings.step.3': 'Tümü her şeyi geri koyar.',
  'help.guide.filter-bookings.step.4':
    'Rozetlerin yanındaki avatarlar yolcuya göre filtreler, bir kişiye ya da aynı anda birkaçına.',
  'help.guide.filter-bookings.step.5':
    'Askıda olması ve Onaylandı iki bölümdür, her biri kendi sayısıyla. Birini katlamak için bir başlığa tıklayın; geri geldiğinizde hâlâ katlıdır.',
  'help.guide.filter-bookings.result':
    'Sekme yalnızca seçtiğinizi gösterir ve bu tarayıcı oturumunda ona geri döndüğünüzde seçim hâlâ yerindedir.',
  'help.guide.filter-bookings.tip.1':
    'Rozetler yalnızca gezinin sahip olduğu türleri sunar, bu yüzden tek bir turu olmayan bir gezide Tur rozeti yoktur.',
  'help.guide.filter-bookings.tip.2':
    'Hiçbir şeyle eşleşmeyen bir filtre sekmeyi Hiçbir yer bulunamadı ile boş bırakır. Bu ifade yerler listesinindir; anlamı aynıdır.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Bir rezervasyonu onayından okuyun',
  'help.guide.import-booking-file.goal':
    'Rezervasyonu yeniden yazmak yerine, sağlayıcının gönderdiği postadan ya da PDF dosyasından TREK çekip çıkarsın.',
  'help.guide.import-booking-file.step.1':
    'Araç çubuğunda Dosyadan içe aktar düğmesine tıklayın. Rezervasyon onaylarını içe aktar açılır.',
  'help.guide.import-booking-file.step.2':
    'Onayları kutunun üzerine bırakın ya da kutuya tıklayıp seçin: EML, PDF, PKPass, HTML ve TXT, her biri 10 MB olan en fazla beş dosya. Seçtikleriniz kutunun üzerinde adlarıyla yazar.',
  'help.guide.import-booking-file.step.3':
    'İçe aktar düğmesine tıklayın. Okuma arka planda olduğu için pencere hemen kapanır.',
  'help.guide.import-booking-file.step.4':
    'Sağ altta bir kart, dosyanın adı altında işin gidişatını bildirir ve uygulama içinde, bir yeniden yüklemede bile sizi izler. Okuma bittiğinde Dosyalar işleniyor… bir onay işaretine dönüşür ve kart İçe aktar sunar. Tıklayın.',
  'help.guide.import-booking-file.result':
    'Rezervasyon, geceleri, kodu ve Dosyalar altındaki onayıyla Askıda olması altında bir karttır, konaklama planın o günlerinde durur ve Maliyetler açıkken fiyat ona bağlı bir harcamadır.',
  'help.guide.import-booking-file.tip.1':
    'Dosyadan içe aktar yalnızca sunucu onayları okuyabildiğinde vardır, bunun için de ya çıkarıcı ya da Yapay zekâ ile ayrıştırma eklentisi gerekir. Yönetici o eklentiyi Eklentiler altından açıp kapatır.',
  'help.guide.import-booking-file.tip.2':
    'Hiçbir şey okunamadıysa kart bunu söyler ve aynı dosyaları doğrudan modele gönderen Try AI parsing sunar. Biten bir ayrıştırma on dakika saklanır; gözden geçirmeyi bu süre içinde başlatın.',
  'help.guide.import-booking-file.tip.3':
    'Onay yalnızca türü yönetici ayarlarındaki İzin Verilen Dosya Türleri arasında olduğunda eklenir. PDF baştan oradadır; bir posta, EML, önce eklenmelidir, yoksa rezervasyon onsuz kaydedilir.',
  // edit-booking
  'help.guide.edit-booking.title': 'Bir rezervasyonu değiştirin',
  'help.guide.edit-booking.goal':
    'Bir saati düzeltin, sonradan gelen kodu ekleyin ya da bir rezervasyonu Askıda olması durumundan Onaylandı durumuna taşıyın.',
  'help.guide.edit-booking.step.1':
    'Kartın başlığındaki kaleme tıklayın. Rezervasyonu Düzenle, rezervasyonun bildiği her şeyle açılır.',
  'help.guide.edit-booking.step.2':
    'Değişmesi gerekeni değiştirin, burada işletmecinin sonunda gönderdiği Rezervasyon Kodunu.',
  'help.guide.edit-booking.step.3': 'Durum alanını Onaylandı yapın.',
  'help.guide.edit-booking.step.4': 'Güncelle düğmesine tıklayın.',
  'help.guide.edit-booking.result':
    'Kart taşınır: onaylanmış bir rezervasyon yeşil bir noktanın arkasında Onaylandı bölümünde durur ve gezideki herkes onun taşındığını görür.',
  'help.guide.edit-booking.tip.1':
    'Okuyamadığınız bir Rezervasyon Kodu, Ayarlar içinde Görünüm altındaki Rezervasyon Kodlarını Bulanıklaştır ayarıdır. Üzerine gelin ya da tıklayın, okunur hâle gelir.',
  'help.guide.edit-booking.tip.2':
    'Türü değiştirin, bağlı bir harcamanın kategorisi de onu izler, maliyet düzenleyicisinde bir kategoriyi elle seçmiş olmadığınız sürece.',
  'help.guide.edit-booking.tip.3': 'Bir konaklama da burada düzenlenir: İtibaren ve İle günleri aynı formdadır.',
  // delete-booking
  'help.guide.delete-booking.title': 'Bir rezervasyonu silin',
  'help.guide.delete-booking.goal': 'Suya düşen bir rezervasyonu geziden çıkarın.',
  'help.guide.delete-booking.step.1': 'Kartın başlığındaki çöp kutusuna tıklayın.',
  'help.guide.delete-booking.step.2':
    'Rezervasyon silinsin mi? seçtiğinizi adlandırır ve kalıcı olarak silineceğini söyler.',
  'help.guide.delete-booking.step.3': 'Onayla düğmesine tıklayın.',
  'help.guide.delete-booking.result':
    'Kart gitmiştir, gezideki herkes için. Bir rezervasyonun geri alması yoktur, bu yüzden o soru son duraktır.',
  'help.guide.delete-booking.tip.1':
    'Bir konaklama rezervasyonunu silmek gecelerini de gün planından çıkarır ve ona bağlı olan harcamayı kaldırır.',
  'help.guide.delete-booking.tip.2':
    'Eklenmiş olan belgeler gezinin Dosyalar sekmesinde kalır; yalnızca rezervasyona olan bağları gider.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Bulunan her rezervasyon Yeni Rezervasyon içinde, art arda ve çoktan doldurulmuş olarak açılır. Bir otel için bu, Başlık içindeki ad ve gezide yer varsa Konaklama altında yer, Konum / Adres bilgisi, geceleri üzerinde İtibaren ve İle, Giriş ve Çıkış yapmak, Rezervasyon Kodu, Dosyalar altında onay ve Maliyetler açıkken Bağlı harcama olarak fiyattır. Denetleyin ve Ekle düğmesine tıklayın.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Maliyetler',
  'help.ctx.trip-costs.summary':
    'Seyahatin parası: her harcama tarihli bir defter olarak, parayı kimin verdiği ve kimin borçlu olduğu, fiş hangi para birimindeyse o para biriminde, ve sağ sütunda, her şeyin yeniden denk olması için kimin kime ödemesi gerektiği.',
  'help.ctx.trip-costs.bullet.1':
    'Üstte dört kart: Borcunuz ve Size borçlu hesaplaşmanın kendi tarafınız, Bekleyen tutar kaydedilmiş ama henüz ödeyeni olmayan şey, Toplam seyahat harcaması ise her şeyi toplar ve altında Sizin payınız ile Siz ödediniz yer alır.',
  'help.ctx.trip-costs.bullet.2':
    'Sağ üstteki Harcama ekle düzenleyiciyi açar; yanındaki Hesaplaş açık olan bütün transferleri tek seferde kaydeder.',
  'help.ctx.trip-costs.bullet.3':
    'Defter güne göre gruplanır, en yenisi önce, o günün toplamı sağda. Bir satır kategoriyi renkli bir sekme olarak, adı, ödeyen pullarını, notu ve tutarı taşır; bölüşüm sizi artıda ya da ekside bırakıyorsa ayrıca verdiniz veya aldınız ibaresini taşır.',
  'help.ctx.trip-costs.bullet.4':
    'Listenin üstünde Harcamalarda ara…, bir kategori filtresi, bir gün filtresi, Tümü / Benim ödediklerim / Bana borçlu anahtarı ve CSV dışa aktar düğmesi durur.',
  'help.ctx.trip-costs.bullet.5':
    'Sağ sütun cevaptır: Hesaplaş kimin kime ödediğini listeler, Bakiyeler her yolcunun fazlasını ya da eksiğini gösterir, Nihai bütçe seyahatin her birine kaça mal olduğunu, Kategoriye göre ise paranın nereye gittiğini gösterir.',
  'help.ctx.trip-costs.bullet.6':
    'Kaydedilmiş bir ödeme aynı defterde kendi satırı olarak durur, yanında Düzenle ve Geri al ile; bir harcamanın kalemi ve çöp kutusu vardır ve çöp kutusu onu sormadan siler.',
  // add-expense
  'help.guide.add-expense.title': 'Harcama ekleyin',
  'help.guide.add-expense.goal': 'Bir şeyin kaça mal olduğunu, kimin ödediğini ve kimlerle paylaşıldığını kaydedin.',
  'help.guide.add-expense.step.1':
    'Maliyetler sekmesinin sağ üstündeki Harcama ekle düğmesine tıklayın. Düzenleyici, bugünün tarihiyle ve herkes bölüşüme dahil olarak açılır.',
  'help.guide.add-expense.step.2':
    'Ne için olduğunu, doldurulması zorunlu tek alan olan Ne içindi? alanına, fişteki rakamı da Toplam tutar alanına yazın.',
  'help.guide.add-expense.step.3':
    'Para birimi ve Gün tutarın altında durur. Para birimi seyahatin kendi para biriminden başlar; değiştirin, düzenleyici tutarın seyahat para biriminde ne ettiğini gösterir. Gün bugünden başlar ve defter harcamayı onun altında gruplar.',
  'help.guide.add-expense.step.4':
    'Bir Kategori seçin. On dört tane vardır ve değiştirilemezler: seçtiğiniz kategori satırdaki renkli sekme ve Kategoriye göre içindeki çubuktur.',
  'help.guide.add-expense.step.5':
    'Kim ödedi? altında parayı gerçekten veren kişiyi seçin. Siz önceden seçilidir; Henüz kimse ödemedi tutarı kimseyi borçlu kılmadan kaydeder, Birden fazla kişi ödedi ise hesabı birkaç ödeyen arasında böler.',
  'help.guide.add-expense.step.6':
    'Split, herkes dahil olacak şekilde Equally ile başlar ve her adın yanında düşen pay görünür. Kaydetmek için Harcama ekle düğmesine tıklayın.',
  'help.guide.add-expense.result':
    'Harcama kendi gününün altında deftere girer, Toplam seyahat harcaması içine sayılır ve hesaplaşma sütunu kimin kime borçlu olduğunu yeniden hesaplar.',
  'help.guide.add-expense.tip.1':
    'Açıldığı gibi bırakılırsa harcama seyahatin para biriminde, bugünün tarihli ve herkes arasında eşit bölüşülmüş olur: gerçekten doldurulması gereken yalnızca ad ve tutardır.',
  'help.guide.add-expense.tip.2':
    'Tutarın yanındaki ±, harcamayı iadeye çevirir. Eksi bir toplam para almak yerine para geri verir ve bölüşüm ters yönde işler.',
  'help.guide.add-expense.tip.3':
    'Aşağıdaki Fiş / fatura ekle görselleri ve PDF dosyalarını alır. Kaydettiğinizde yüklenirler, seyahatin Dosyalar bölümüne düşerler ve listede adın yanında bir Fişler rozeti belirir.',
  // expense-payers
  'help.guide.expense-payers.title': 'Hesabı kimin ödediğini belirtin',
  'help.guide.expense-payers.goal':
    'Bir harcama için cebinden parayı kimin çıkardığını kaydedin, hesaplaşma matematiğinin diğer yarısı.',
  'help.guide.expense-payers.step.1':
    'Satırının yanındaki kalemle bir harcamayı açın ve Kim ödedi? alanına bakın. Tek kişi ödedi varsayılandır: açılır liste parayı veren tek kişiyi adlandırır.',
  'help.guide.expense-payers.step.2':
    'O listenin ilk girdisi olan Henüz kimse ödemedi, tutarı kimseyi bir şeye borçlu kılmadan kaydeder. Harcama yine de Toplam seyahat harcaması içine sayılır.',
  'help.guide.expense-payers.step.3':
    'Etiketin yanındaki bağlantı olan Birden fazla kişi ödedi, her yolcu için bir satır açar. Ödeyenleri ekleyin ve her birinin ne kadar koyduğunu yazın; tutarların toplamı toplam tutarı vermelidir.',
  'help.guide.expense-payers.step.4':
    'Kimsenin ödemediği bir harcama satırında Tamamlanmadı olarak işaretlenir ve kaydedilmiş ama hesaplaşılmamış harcamaların toplandığı Bekleyen tutar kartına sayılır.',
  'help.guide.expense-payers.result':
    'Kimin ödediği kime geri ödeneceğini belirler, bölüşüm kimin ödeyeceğini belirler ve Bakiyeler ikisi arasındaki farktır.',
  'help.guide.expense-payers.tip.1':
    'Kim ödedi? ve Split birbirinden bağımsızdır: katılmadığınız bir yemeği ödeyebilir, ödemediğiniz bir yemeğin bölüşümüne girebilirsiniz.',
  'help.guide.expense-payers.tip.2':
    'Birkaç ödeyen varken tutarların toplamı toplam tutarı vermelidir. Bir kişi daha ekleyin, diğerleri onun etrafında yeniden düzenlenir; tutmadıkları sürece düzenleyici toplamda ne etmeleri gerektiğini söyler ve kaydetmeyi reddeder.',
  'help.guide.expense-payers.tip.3':
    'Bir ödeyeni kaldırmak harcamayı kaldırmaz: tutar Toplam seyahat harcaması içinde kalır ve satır Tamamlanmadı olur.',
  // split-expense
  'help.guide.split-expense.title': 'Bir hesabı yolcular arasında bölüşün',
  'help.guide.split-expense.goal':
    'Bir harcamanın kime borç yazılacağına karar verin: herkes eşit olarak, tutara göre ya da fişten satır satır.',
  'help.guide.split-expense.step.1':
    'Harcama düzenleyicisinde Split her yolcuyu listeler. Birini bu harcamanın dışında bırakmak için adına tıklayın; dışarıda bırakılan yolcu Dahil değil olarak görünür ve onun için hiçbir şey borçlu olmaz.',
  'help.guide.split-expense.step.2':
    'Equally varsayılandır: dahil edilen her yolcu aynı payı alır ve listenin altındaki satır kaç kişiye bölündüğünü ve her payın ne ettiğini söyler.',
  'help.guide.split-expense.step.3':
    'Custom payları tutar alanlarıyla değiştirir. Her yolcunun ne kadar borçlu olduğunu yazın; alttaki satır siz yazdıkça toplamı sayar ve Bölüşüm toplamla eşleşiyor olunca yeşile döner. Tutmadığı sürece kaydetmez.',
  'help.guide.split-expense.step.4':
    'Ticket fişi satır satır böler: Kalem ekle, sonra her satıra bir ad ve bir fiyat, ve Bölüşülüyor: altında o satırı paylaşan yolcular.',
  'help.guide.split-expense.step.5':
    'Satırların altındaki Kişi başı pay her yolcunun sonunda ne kadar borçlu olduğunu gösterir, üstteki Toplam tutar ise satırlardan toplanır. Kaydet düğmesine tıklayın.',
  'help.guide.split-expense.result':
    'Bölüşüm her bakiyenin üzerine kurulduğu temeldir. Harcamayla birlikte kaydedilir ve başka hiçbir şeye dokunmadan sonradan değiştirilebilir.',
  'help.guide.split-expense.tip.1':
    'Dışarıda bıraktığınız bir yolcu Dahil değil olarak görünür ve yalnızca bu harcama için hiçbir şey borçlu olmaz; diğerleri onun payını üstlenir.',
  'help.guide.split-expense.tip.2':
    'Equally sente kadar kusursuzdur: artan sent harcamadan harcamaya dönerek geçer, böylece onu hep aynı kişi ödemez.',
  'help.guide.split-expense.tip.3':
    'Ticket kipi Toplam tutar alanını kendisi toplar ve alanı soluklaştırır: fişin satırları toplamı oluşturur.',
  // expense-currency
  'help.guide.expense-currency.title': 'Başka bir para biriminde harcama girin',
  'help.guide.expense-currency.goal': 'Fişte gerçekten yazan neyse onu girin, kuru TREK tutsun.',
  'help.guide.expense-currency.step.1':
    'Harcama ekle düğmesine tıklayın ve adı ile tutarı tam olarak fişte yazdığı gibi doldurun, rakamın kendisini, çevrilmiş halini değil.',
  'help.guide.expense-currency.step.2':
    'Para birimi alanını açın ve fişin para birimini seçin. Liste TREK’in bildiği her kodu taşır ve içinde arama yapılabilir: üç harfi yazın.',
  'help.guide.expense-currency.step.3':
    'Alanların altında tutarın şu anda ne ettiğini gösteren, anlık kur olarak işaretlenmiş bir satır belirir. Bu bir önizlemedir, saklanan şey değildir.',
  'help.guide.expense-currency.step.4':
    'Harcama ekle düğmesine tıklayın. Kur o anda dondurulur: bundan sonra bu harcama, girdiğiniz gün ne ediyorsa o kadar eder.',
  'help.guide.expense-currency.step.5':
    'Defterde satır adın altında iki rakamı da taşır: yazdığınız tutar, bir ok ve seyahatin para biriminde ne saydığı. Yukarıdaki her toplam, bakiye ve hesaplaşma ikincisini kullanır.',
  'help.guide.expense-currency.result':
    'Harcama yazdığınız tutarı ve para birimini korur. Defter ikisini de gösterir, seyahatin toplamları ve bakiyeleri ise seyahatin para biriminde kalır.',
  'help.guide.expense-currency.tip.1':
    'Kur kaydettiğiniz anda dondurulur, böylece hesaplaşılmış bir borç, piyasa bir hafta sonra kımıldadı diye yeniden açılmaz. Yeni bir kuru yalnızca harcamanın para birimini değiştirmek dondurur.',
  'help.guide.expense-currency.tip.2':
    'Ayarlar içindeki Görüntüleme para birimi yalnızca okuduğunuzu değiştirir; saklanan tutarlar asla yerinden oynamaz. Boş bırakılırsa her seyahat kendi para biriminde gösterilir.',
  'help.guide.expense-currency.tip.3':
    'Seyahat para biriminin kendisi seyahatin üzerinde, Seyahati Düzenle altında yaşar ve Seyahat ayrıntılarını düzenle hakkını gerektirir. Onu değiştirmek tutarları başka bir para birimine çevirmek yerine dondurulmuş her kuru yeniden çıpalar.',
  // filter-costs
  'help.guide.filter-costs.title': 'Bir harcamayı ya da bir günün harcamalarını bulun',
  'help.guide.filter-costs.goal': 'Uzun bir defteri gerçekten aradığınız şeye daraltın.',
  'help.guide.filter-costs.step.1':
    'Listenin üstündeki Harcamalarda ara… alanına yazın. Siz yazdıkça harcamanın adında eşleşme arar.',
  'help.guide.filter-costs.step.2':
    'Tüm kategoriler on dört kategoriyi açar. Birini seçin, yalnızca o kategorinin harcamaları kalır.',
  'help.guide.filter-costs.step.3':
    'Tüm günler bir şey harcanmış her günü listeler. Birini seçin, bir şerit gün başlıklarının yerini o günle, kaç harcama tuttuğuyla ve toplamıyla değiştirir.',
  'help.guide.filter-costs.step.4':
    'Tümü / Benim ödediklerim / Bana borçlu anahtarı defterin size ait görünümüdür: ne için para verdiğiniz ve hangi harcamalarda hâlâ cebinizden çıkmış durumda olduğunuz.',
  'help.guide.filter-costs.step.5':
    'Satırın sonundaki CSV dışa aktar her harcamayı bir dosyaya yazar; özgün tutar, para birimi ve çevrilmiş tutarla birlikte.',
  'help.guide.filter-costs.result':
    'Filtreler birleşir ve gün grupları, geriye ne kalırsa onun kendi toplamlarıyla yeniden çizilir.',
  'help.guide.filter-costs.tip.1':
    'Kaydedilmiş ödemeler ad ve kategori taşımaz, bu yüzden bir arama ya da kategori filtresi onları gizler. Gün filtresi onları, ödemenin kaydedildiği günün altında tutar.',
  'help.guide.filter-costs.tip.2':
    'CSV dışa aktar, ekranda ne filtrelenmiş olursa olsun her zaman her harcamayı, harcama başına bir satır olarak dışa aktarır.',
  // settle-up
  'help.guide.settle-up.title': 'Kimin kime borçlu olduğunu çıkarın ve hesaplaşın',
  'help.guide.settle-up.goal':
    'Bir yığın ortak harcamayı herkesi denkleştiren en az sayıda transfere dönüştürün ve gerçekleştikçe kaydedin.',
  'help.guide.settle-up.step.1':
    'Sağ sütundaki Hesaplaş kartı herkesi denkleştirecek transferleri listeler: kimin kime, ne kadar ödediğini. Başlığın yanındaki sayı kaç tanesinin hâlâ açık olduğudur.',
  'help.guide.settle-up.step.2':
    'Bir transferin yanındaki Hesaplaş onu yapılmış olarak kaydeder. Akış karttan kaybolur ve bakiyeler yeniden çizilir.',
  'help.guide.settle-up.step.3':
    'Kaydedilen transfer defterde bir satırdır, gerçekleştiği günün altında, iki yolcu ve tutarla birlikte Ödeme olarak işaretlenir.',
  'help.guide.settle-up.step.4':
    'O satırın yanında kalem bir ödemeyi düzeltir, Geri al onu geri alır ve transfer Hesaplaş kartına döner.',
  'help.guide.settle-up.step.5':
    'Kart başlığındaki Ödeme ekle, bir öneriyi izlemeyen bir transferi kaydeder. Gönderen ve Alıcı seçin, tutarı, para birimini ve gerçekleştiği günü girin.',
  'help.guide.settle-up.step.6':
    'Ekranın en üstündeki başlıkta yer alan Hesaplaş, açık olan bütün transferleri tek seferde kaydeder, bir grubun seyahat sonunda hesabını kapatması gibi.',
  'help.guide.settle-up.result':
    'Kaydedilen her transfer defterde bir satır, Hesaplaş kartında bir satır eksilmesidir. Kartta Herkesin hesabı kapalı yazdığında seyahat ödenmiş demektir.',
  'help.guide.settle-up.tip.1':
    'Kart her borcu değil, en az sayıda transferi gösterir: birbirine döngü halinde borçlu üç kişi bir ya da iki ödemeye iner.',
  'help.guide.settle-up.tip.2':
    'Hesaplaş bir transferi kaydeder, parayı taşımaz. Parayı hangi yolla gönderiyorsanız onunla gönderin, sonra tıklayın.',
  'help.guide.settle-up.tip.3':
    'Bir ödeme herhangi bir para biriminde yapılabilir, yani yen cinsinden bir borcu euro ile ödemek olağandır: iletişim kutusunun kendi para birimi seçicisi vardır ve o kuru da dondurur.',
  // final-budget
  'help.guide.final-budget.title': 'Seyahatin her yolcuya kaça mal olduğunu görün',
  'help.guide.final-budget.goal':
    'Defterin kişi başına düşen tarafını okuyun: bugünkü bakiye ve kişi başına gerçek maliyet.',
  'help.guide.final-budget.step.1':
    'Bakiyeler her yolcunun durumunu gösterir: seyahat ona borçluysa sağa doğru yeşil bir çubuk, o seyahate borçluysa sola doğru kırmızı bir çubuk ve adın yanında tutar.',
  'help.guide.final-budget.step.2':
    'Altındaki Nihai bütçe başka bir soruya cevap verir: şu anda kimin ne borçlu olduğunu değil, her şey geri ödendiğinde seyahatin her yolcuya kaça mal olduğunu.',
  'help.guide.final-budget.step.3':
    'Aritmetiği açmak için bir ada tıklayın: Ödenen harcamalar, sonra altında Net geri ödemeler ve Bekleyen geri ödemeler.',
  'help.guide.final-budget.step.4':
    'Her satırın altında onu oluşturan satırlar durur: o yolcunun ödediği harcamalar, kaydedilmiş transferler ve hâlâ açık olanlar. Üstlerindeki satırı tam olarak verirler.',
  'help.guide.final-budget.result':
    'Bakiyeler bugün kimin artıda ya da ekside olduğudur; Nihai bütçe her şey geri ödendiğinde seyahatin her birinize kaça mal olduğudur.',
  'help.guide.final-budget.tip.1':
    'Bir ödemeyi kaydetmek kimsenin nihai bütçesini değiştirmez. Yalnızca bir tutarı bekleyen geri ödemelerden net geri ödemelere taşır.',
  'help.guide.final-budget.tip.2':
    'Ödeyeni olmayan bir harcama, hesaplaşma önerilerinin dışında kaldığı gibi her iki kartın da dışında kalır.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Bir rezervasyonu harcamaya dönüştürün',
  'help.guide.expense-from-booking.goal':
    'Bir uçuşun, bir otelin ya da bir yerin gerçekten kaça mal olduğunu ait olduğu kayda iliştirin.',
  'help.guide.expense-from-booking.step.1':
    'Rezervasyonu Ulaşım ya da Rezervasyonlar sekmesinde açın ve kalemine tıklayın.',
  'help.guide.expense-from-booking.step.2':
    'Formun altındaki Maliyetler bloğuna inin. Önce rezervasyonu kaydeden Harcama oluştur ile zaten Maliyetler içinde olan bir harcama için Mevcut harcamayı bağla sunar.',
  'help.guide.expense-from-booking.step.3':
    'Harcama oluştur düğmesine tıklayın. Rezervasyon kaydedilir, form kapanır ve Maliyetler düzenleyicisi rezervasyonun başlığını ad olarak, türünü de bir kategoriyle eşleştirilmiş halde açar.',
  'help.guide.expense-from-booking.step.4':
    'Tutarı ve para birimini, kimin ödediğini ve bölüşümü her harcamada olduğu gibi doldurup kaydedin. Rezervasyonu yeniden açtığınızda harcama Bağlı harcamalar altında görünür; düzenlemek için bir kalem, serbest bırakmak için Bağlantıyı kaldır, harcamayı tut ve kaldırmak için bir çöp kutusuyla.',
  'help.guide.expense-from-booking.result':
    'Rezervasyon maliyetini taşır ve harcama, Maliyetler sekmesinde ödeyeni, bölüşümü ve para birimiyle diğerleri gibi sıradan bir satırdır.',
  'help.guide.expense-from-booking.tip.1':
    'Rezervasyonu silmek bağlı harcamalarını da onunla birlikte siler. Rezervasyonun Maliyetler bloğundaki Harcamayı kaldır bunun tersini yapar: harcama gider, rezervasyon kalır. Bağlantıyı kaldır, harcamayı tut ikisini de tutar.',
  'help.guide.expense-from-booking.tip.2':
    'Bir yerin formunda da aynı blok vardır, Harcama oluştur orada önce yeri kaydeder.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Ulaşım',
  'help.ctx.trip-transports.summary':
    'Sizi duraklar arasında taşıyan her şey: uçuşlar, trenler, otobüsler, arabalar, taksiler, bisikletler, gemi turları, feribotlar ve TREK’in sizin için bulduğu toplu taşıma bağlantıları. Sekme bunların listesidir; planda da oluşturulur ve okunurlar, haritaya da çizilirler.',
  'help.ctx.trip-transports.bullet.1':
    'Sekme yalnızca yolculukları tutar. Konaklama, restoranlar, etkinlikler ve biletler Rezervasyonlar sekmesinde yaşar, bu yüzden aynı kayıt asla iki kez görünmez.',
  'help.ctx.trip-transports.bullet.2':
    'Araç çubuğu hepsini Tümü altında sayar ve kullanılan her türe kendi sayısıyla kendi çipini verir: Uçuş, Tren, Araba, Toplu taşıma. Sağdaki Ulaşım elle bir tane ekler.',
  'help.ctx.trip-transports.bullet.3':
    'Kartlar üç grup hâlinde gelir, her biri başlığından katlanabilir: aramanın planladığı bağlantılar için Otomatik toplu taşıma, sonra Askıda olması, sonra Onaylandı.',
  'help.ctx.trip-transports.bullet.4':
    'Bir kart durumu, türü, kapsadığı günleri, saatleri, Rezervasyon Kodunu, rotayı ve Havayolu ile Uçuş No. ya da Tren No., Platformu ve Koltuk bilgisini taşır. Kalem onu açar, çöp kutusu bir sorudan sonra siler.',
  'help.ctx.trip-transports.bullet.5':
    'Ulaşım planda da oluşturulur: her gün başlığında Ulaşım ekle için bir artı ve Toplu taşıma için bir tramvay düğmesi vardır, iki durak arasındaki yolculuk süresi bağlayıcısı da aynı aramayı o tek etap için açar.',
  'help.ctx.trip-transports.bullet.6':
    'İki ucu da ayarlanmış bir ulaşım haritaya bir çizgi çizer. Gün planındaki satırında bulunan rota simgesi o çizgiyi açar, günlerin üstündeki araç çubuğundaki Tüm rezervasyon rotalarını göster ise bütün seyahati çevirir.',
  // transports-list
  'help.guide.transports-list.title': 'Ulaşım sekmesini okuyun',
  'help.guide.transports-list.goal': 'Listede bir şey değiştirmeden önce size ne anlattığını bilin.',
  'help.guide.transports-list.step.1':
    'Ulaşım, seyahatin ikinci sekmesidir. Yalnızca yolculukları tutar: oteller, restoranlar, etkinlikler ve biletler Rezervasyonlar sekmesindedir.',
  'help.guide.transports-list.step.2':
    'Araç çubuğu her ulaşımı Tümü altında sayar ve kullanılan her türe kendi sayısıyla kendi çipini verir. Yalnızca o türü bırakmak için bir çipe tıklayın, bırakmak için tekrar tıklayın. Aynı anda birkaç çip açık olabilir, Tümü ise hepsini temizler.',
  'help.guide.transports-list.step.3':
    'Otomatik toplu taşıma kendi grubudur, toplu taşıma aramasının planladığı bağlantılar. Askıda olması ve Onaylandı elle girilen her şeyi tutar. Bir başlığın yanındaki ok grubu katlar.',
  'help.guide.transports-list.step.4':
    'Bir kart her şeyi söyler: Askıda olması ya da Onaylandı ile durum noktası, tür, kapsadığı günler ve tarihleri, saatler, Rezervasyon Kodu, rota ve Havayolu ile Uçuş No. ya da Tren No., Platformu ve Koltuk.',
  'help.guide.transports-list.step.5':
    'Kalem ulaşımı düzenlemek için açar, çöp kutusu ise neyin gideceğini adlandıran bir sorudan sonra siler.',
  'help.guide.transports-list.result':
    'Liste aradığınız şeye daraltılır ve her kart bir bakışta yolculuğun rezerve edilip edilmediğini söyler.',
  'help.guide.transports-list.tip.1':
    'Çipler ve katlanmış gruplar her seyahat için ayrı hatırlanır, böylece sekme bıraktığınız gibi yeniden açılır.',
  'help.guide.transports-list.tip.2':
    'Dosyadan içe aktar ve AirTrail araç çubuğunda Ulaşım düğmesine yalnızca sunucu rezervasyon onaylarını okuyabildiğinde ve bir AirTrail örneği bağlı olduğunda katılır. Onlar olmadan liste elle ve toplu taşıma aramasıyla doldurulur.',
  // add-transport
  'help.guide.add-transport.title': 'Bir güne ulaşım ekleyin',
  'help.guide.add-transport.goal': 'Sizi bir duraktan diğerine götüren yolculuğu, gerçekleştiği güne koyun.',
  'help.guide.add-transport.step.1':
    'Her gün başlığı sağında dört küçük düğme taşır. İpucu Ulaşım ekle yazan artıya tıklayın. Form, Tarih zaten o güne ayarlanmış olarak açılır.',
  'help.guide.add-transport.step.2':
    'Rezervasyon Türü neyle gittiğinizi seçer: Uçuş, Tren, Otobüs, Araba, Taksi, Bisiklet, Dolaşmak, Feribot ya da Diğer. Form buna uyar. Bir uçuş her etapta bir havaalanı, bir tren bir istasyon zinciri, bir araba ise Alış ve İade sözcükleriyle Yol üzerindeki duraklar alanını alır.',
  'help.guide.add-transport.step.3':
    'Başlık doldurulması zorunlu tek alandır; onsuz Ekle gri kalır. Peron panosunda tanıyacağınız şeyi yazın.',
  'help.guide.add-transport.step.4':
    'İtibaren ve İle bir istasyon, bir liman ya da bir adres arar. En az üç harf yazın ve listeden bir sonuç seçin. Yalnızca yazılmış bir ad koordinat taşımaz, bu yüzden haritaya hiçbir şey çizmez.',
  'help.guide.add-transport.step.5':
    'Tarih ve Başlangıç zamanı ne zaman gittiğini, Bitiş tarihi ve Bitiş zamanı ne zaman bittiğini söyler; ertesi gün inen bir yolculuk orada ertesi günü alır. Rezervasyon Kodu, Askıda olması ya da Onaylandı ile Durum ve Notlar isteğe bağlıdır.',
  'help.guide.add-transport.step.6': 'Ekle düğmesine tıklayın.',
  'help.guide.add-transport.result':
    'Ulaşım, gündeki bir satırdır, duraklar arasında kendi saatinde, ve Ulaşım sekmesinde Askıda olması ya da Onaylandı altında bir karttır.',
  'help.guide.add-transport.tip.1':
    'Satır, başlangıç saatinin koyduğu yere, daha erken başlayan son duraktan sonra iner. Tutamağı onu gün içinde başka herhangi bir yere ya da başka bir güne sürükler.',
  'help.guide.add-transport.tip.2':
    'Dosyalar altındaki Dosya ekle bileti alır, Maliyetler altındaki Harcama oluştur ise rezervasyonu kaydeder ve bilet ücreti için Maliyetler düzenleyicisini açar.',
  'help.guide.add-transport.tip.3':
    'Yolcular bu yolculukta kimin olduğunu işaretler. Bir ulaşımın yolcuları olur olmaz sekmenin araç çubuğunda avatarları belirir ve listeyi onlara göre süzer.',
  // plan-transit
  'help.guide.plan-transit.title': 'Bir toplu taşıma bağlantısı planlayın',
  'help.guide.plan-transit.goal':
    'TREK’in bir günün iki noktası arasındaki gerçek trenleri ve otobüsleri bulmasına izin verin ve seçtiğinizi plana koyun.',
  'help.guide.plan-transit.step.1':
    'Gün başlığında tramvay düğmesine, Toplu taşıma, tıklayın. Arama o gün için açılır.',
  'help.guide.plan-transit.step.2':
    'Nereden ve Nereye bir durak ya da istasyon alır. Kutu hâlâ boşken günün kendi durakları ve gezinin konaklamaları sunulur; iki harf yazmak bunun yerine tarifedeki istasyonları arar. İki kutu arasındaki Değiştir bağlantıyı ters çevirir.',
  'help.guide.plan-transit.step.3':
    'Bir saatle Kalkış ya da Varış ne zaman seyahat etmek istediğinizi, En iyi rota, Daha az aktarma ya da Daha az yürüme ise yanıtların nasıl sıralanacağını söyler.',
  'help.guide.plan-transit.step.4':
    'Aşağıdaki çipler hangi türlerin kullanılabileceğini söyler: Tren, Metro, Tramvay, Otobüs, Vapur ve Teleferik. Birini dışarıda bırakmak için kapatın, en az biri açık kalır. Sonra Ara düğmesine tıklayın.',
  'help.guide.plan-transit.step.5':
    'Her sonuç kalkış ve varışı, ne kadar sürdüğünü, kaç aktarma ve ne kadar yürüme olduğunu ve hatları kendi renkleriyle verir. Durak durak açmak için birine tıklayın, peronlarla ve hatlar arasındaki yürüyüşlerle birlikte.',
  'help.guide.plan-transit.step.6': 'Güne ekle düğmesine tıklayın.',
  'help.guide.plan-transit.result':
    'Bağlantı, hatlarıyla, aktarmalarıyla ve yürüme süresiyle gündeki bir satırdır, ve Ulaşım sekmesinde Otomatik toplu taşıma altında bir karttır.',
  'help.guide.plan-transit.tip.1':
    'Bağlantılar, açık tarife verileri üzerinde çalışan ücretsiz bir topluluk hizmeti olan Transitous’tan gelir: anahtar yok, hesap yok. Bir yönetici aramayı bunun yerine Google’a yöneltebilir.',
  'help.guide.plan-transit.tip.2':
    'Hiçbir şey bulunamadı mı? Akışlar bir bölgeyi ve bir dönemi kapsar. Başka bir saat deneyin, daha fazla tür açın ya da yerin kendisi yerine bir istasyon seçin. Mesaj yanıtlayan hizmeti adlandırır.',
  'help.guide.plan-transit.tip.3':
    'Aynı arama tek bir etap için de açılır: iki durak arasındaki yolculuk süresi bağlayıcısına tıklayın ve Toplu taşıma seçin. Nereden, Nereye ve kalkış saati sizin için doldurulur.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Planlanmış bir bağlantıyı açın ve değiştirin',
  'help.guide.change-transit-route.goal':
    'Bağlantıyı durak durak okuyun, adını değiştirin ya da rotayı yeniden arayın.',
  'help.guide.change-transit-route.step.1':
    'Ulaşım sekmesinde planlanmış bağlantılar Otomatik toplu taşıma altında durur. Karta tıklayın.',
  'help.guide.change-transit-route.step.2':
    'Süre, Aktarma ve Yürüyüş en üstte durur. Altlarındaki Güzergah bağlantıyı durak durak yürür, peronlarla ve hatlar arasındaki yürüyüşlerle birlikte.',
  'help.guide.change-transit-route.step.3':
    'Rotayı değiştir aramayı yeniden çalıştırır, bu bağlantının iki ucu ve günü zaten doldurulmuş olarak.',
  'help.guide.change-transit-route.step.4':
    'Başka bir bağlantı seçin ve Güne ekle düğmesine tıklayın; eskisinin yerini alır. Rotayı değiştir yanındaki Ayrıntıları düzenle ise onun yerine sıradan ulaşım formunu açar, Rezervasyon Kodu, Durum, yolcular ve dosyalar orada yaşar.',
  'help.guide.change-transit-route.result':
    'Toplu taşıma yolculuğu görünümü yeni Güzergahı taşır ve Ulaşım sekmesindeki kartı yeni hatları ve saatleri gösterir.',
  'help.guide.change-transit-route.tip.1':
    'Toplu taşıma yolculuğu görünümündeki başlık yalnızca metindir: yanındaki kalem rotaya dokunmadan adını değiştirir. Altındaki Notlar markdown alır ve bir Düzenle ile bir Önizleme sekmesine sahiptir.',
  'help.guide.change-transit-route.tip.2':
    'Toplu taşıma yolculuğu görünümünün altındaki Sil bağlantıyı seyahatten çıkarır; gün duraklarını korur.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Bir etabın nasıl gidildiğini değiştirin',
  'help.guide.leg-travel-mode.goal':
    'Bir günün, geri kalanı arabayla gidilen bir etabını yürüyün ya da o etabı toplu taşıma aramasına devredin.',
  'help.guide.leg-travel-mode.step.1':
    'Duraklar arasındaki bağlayıcılar yalnızca günün Rota seçeneği açıkken görünür. Günü açmak için ona tıklayın, sonra duraklarının altındaki Rota seçeneğine.',
  'help.guide.leg-travel-mode.step.2':
    'Her bağlayıcı o etabın yolculuk süresini ve mesafesini, rotalandığı türün simgesiyle birlikte adlandırır: sürüş için bir araba, yürüyüş için bir ayak.',
  'help.guide.leg-travel-mode.step.3':
    'Bağlayıcıya tıklayın. Menü Araba ve Yürüyüş, Toplu taşıma ve Günün varsayılanını kullan seçeneklerini sunar.',
  'help.guide.leg-travel-mode.step.4': 'Yürüyüş seçin. Yalnızca bu etap değişir; günün geri kalanı kendi türünü korur.',
  'help.guide.leg-travel-mode.result':
    'Etap ayak simgesini ve yürüme süresini gösterir, günün diğer etapları ise günün türünü korur.',
  'help.guide.leg-travel-mode.tip.1':
    'Tür güne değil etaba aittir: bütün günün Araba ve Yürüyüş düğmeleri elle ayarladığınız bir etabın üzerine asla yazmaz. Günün varsayılanını kullan etabı onlara geri verir.',
  'help.guide.leg-travel-mode.tip.2':
    'Aynı menüdeki Toplu taşıma tam olarak bu etap için bağlantı aramasını açar, iki uç ve kalkış saati zaten doldurulmuş olarak.',
  'help.guide.leg-travel-mode.tip.3':
    'Süreler gerçek yollar ve yaya yolları üzerinde çalışan açık bir rota hesaplayıcıdan gelir. Yanıtlayamadığı bir etap düz çizgisini korur ve süre göstermez.',
  // edit-transport
  'help.guide.edit-transport.title': 'Bir ulaşımı değiştirin ya da silin',
  'help.guide.edit-transport.goal':
    'Bir saati, bir peronu ya da bir rezervasyon kodunu düzeltin ya da yolculuğu seyahatten çıkarın.',
  'help.guide.edit-transport.step.1': 'Gün planında bir ulaşım, duraklar arasındaki renkli bir satırdır. Ona tıklayın.',
  'help.guide.edit-transport.step.2':
    'Form onu oluşturan formdur, başlık çubuğunda Ulaşımı düzenle yazar. Her şey değiştirilebilir: tür, rota, günler ve saatler, Rezervasyon Kodu, Durum.',
  'help.guide.edit-transport.step.3':
    'Bir uçuşun rotası havaalanları zinciri, bir trenin rotası istasyonlar zinciridir. Durak ekle araya bir tane daha koyar ve her etap kendi saatlerini ve kendi uçuş ya da tren numarasını korur.',
  'help.guide.edit-transport.step.4':
    'Güncelle düğmesine tıklayın. Ulaşımı tamamen kaldırmak için Ulaşım sekmesindeki kartında bulunan çöp kutusunu kullanın ve onaylayın.',
  'help.guide.edit-transport.result':
    'Değişiklik ulaşımın göründüğü her yerde görünür: Ulaşım sekmesinde, gittiği günde ve haritadaki çizgisinde.',
  'help.guide.edit-transport.tip.1':
    'Aynı form iki taraftan da açılır, Ulaşım sekmesindeki karttaki kalemden ve gün planındaki ulaşımın kendi satırından. Planlanmış bir toplu taşıma bağlantısı istisnadır: satırı Toplu taşıma yolculuğu görünümünü açar ve oradaki Ayrıntıları düzenle bu forma götürür.',
  'help.guide.edit-transport.tip.2':
    'Bir ulaşımı başka bir güne taşımak forma hiç ihtiyaç duymaz: satırını bir gün kartından diğerine sürükleyin.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Haritaya bir ulaşım çizin',
  'help.guide.transport-on-map.goal':
    'Bir uçuşun, bir araba yolculuğunun ya da bir bağlantının gerçekte nereden geçtiğini görün.',
  'help.guide.transport-on-map.step.1':
    'İki ucu da ayarlanmış bir ulaşım, gün planındaki satırında küçük bir rota simgesi taşır. Ona tıklayın; etiketi Rezervasyon rotalarını gizle olur.',
  'help.guide.transport-on-map.step.2':
    'Rota haritaya çizilir, her iki uçta ulaşımın simgesini taşıyan hap biçiminde bir işaretçiyle.',
  'help.guide.transport-on-map.step.3':
    'Haritadan ayrılmadan rezervasyonu okumak için bir uç işaretçisine tıklayın: saatler, Havayolu ve Uçuş No., Rezervasyon Kodu ve adres. Kapat sayfayı kaldırır.',
  'help.guide.transport-on-map.step.4':
    'Günlerin üstündeki araç çubuğundaki rota simgesi bütün seyahati aynı anda halleder: Tüm rezervasyon rotalarını göster ve onları yeniden temizlemek için Tüm rezervasyon rotalarını gizle.',
  'help.guide.transport-on-map.step.5':
    'Planlanmış bir toplu taşıma bağlantısının kendi simgesi yoktur. Günün Rota anahtarıyla çizilir, bu yüzden o günün rotası hâlâ açıkken Tüm rezervasyon rotalarını gizle onu temizlemez.',
  'help.guide.transport-on-map.result':
    'Rotalar her iki ucunda bir işaretçiyle haritadadır ve siz onları yeniden kapatana kadar orada kalır.',
  'help.guide.transport-on-map.tip.1':
    'Bir uçuş, bir gemi turu ve bir feribot eğri olarak çizilir, bir araba, bir otobüs, bir taksi ve bir bisiklet gerçek yolları izler, bir tren ya da planlanmış bir bağlantı ise uğradığı istasyonlardan geçer.',
  'help.guide.transport-on-map.tip.2':
    'Onaylanmış bir rezervasyon düz bir çizgidir, askıdaki bir rezervasyon kesik çizgidir. Rezervasyon rota etiketleri ayarı uç işaretçilerine havaalanı kodunu ya da istasyon adını yazar.',
  'help.guide.transport-on-map.tip.3':
    'Tüm rezervasyon rotalarını göster bir katman değil, temiz bir sayfadır: tek tek simgelerin ayarladığını atar, bu yüzden iki kez basmak sizi ya her şey açık ya da her şey kapalı bırakır.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Bir uçuşu e-biletinden okuyun',
  'help.guide.import-transport-file.goal':
    'Taşıyıcının gönderdiği biletten bir uçuşu, treni ya da feribotu TREK çekip çıkarsın ve kaydedilmeden önce siz denetleyin.',
  'help.guide.import-transport-file.step.1':
    'Ulaşım sekmesinin araç çubuğunda, Ulaşım düğmesinin yanındaki Dosyadan içe aktar düğmesine tıklayın. Rezervasyonlar sekmesindekiyle aynı pencere olan Rezervasyon onaylarını içe aktar açılır.',
  'help.guide.import-transport-file.step.2':
    'Bileti kutunun üzerine bırakın ya da kutuya tıklayıp seçin: EML, PDF, PKPass, HTML ve TXT, her biri 10 MB olan en fazla beş dosya. Seçtiğiniz dosyalar kutunun üzerinde adlarıyla yazar.',
  'help.guide.import-transport-file.step.3':
    'İçe aktar düğmesine tıklayın. Pencere hemen kapanır; okuma arka planda olur.',
  'help.guide.import-transport-file.step.4':
    'Sağ altta bir kart, dosyanın adı altında işin gidişatını bildirir. Okuma bittiğinde Dosyalar işleniyor… bir onay işaretine dönüşür ve kart İçe aktar sunar. Tıklayın.',
  'help.guide.import-transport-file.step.5':
    'Ulaşım ekle içinde, çoktan doldurulmuş bir uçuş açılır: Rezervasyon Türü Uçuş üzerinde, havayolu ve uçuş numarası Başlık içinde, iki havalimanı Rota altında Kalkış ve Varış ile, saatleri ve saat dilimleri, Havayolu ve Uçuş No., Rezervasyon Kodu ve Dosyalar altında bilet. Denetleyin ve Ekle düğmesine tıklayın.',
  'help.guide.import-transport-file.result':
    'Uçuş, Ulaşım sekmesinde Askıda olması altında bir kart ve kalktığı günde bir satırdır, bilet Dosyalar altındadır ve iki havalimanı da bilindiğinden eğrisini haritaya çizer.',
  'help.guide.import-transport-file.tip.1':
    'İki sekme tek bir içe aktarmayı paylaşır: bir uçuş ve bir otel taşıyan bir dosya, hangi sekmeden başlamış olursanız olun, uçuşu Ulaşım ekle içinde, oteli Yeni Rezervasyon içinde art arda açar.',
  'help.guide.import-transport-file.tip.2':
    'Havalimanları koduyla yerleştirilir. Okumanın konumlandıramadığı bir istasyon ya da liman kartta kehribar renkte adlandırılır; Ekle düğmesine tıklamadan önce onu Rota altında elle seçin, yoksa ulaşım haritaya hiçbir şey çizmez.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail’den uçuşları içe aktarın',
  'help.guide.airtrail-import.goal':
    'AirTrail’de zaten tuttuğunuz uçuşları tek seferde geziye getirin ve o andan itibaren AirTrail’i izlesinler.',
  'help.guide.airtrail-import.step.1':
    'AirTrail eklentisi açıkken ve örneğiniz Ayarlar içindeki Entegrasyonlar altında bağlıyken Ulaşım sekmesinin araç çubuğu, Ulaşım düğmesinin yanında bir AirTrail düğmesi taşır. Tıklayın.',
  'help.guide.airtrail-import.step.2':
    "AirTrail'den içe aktar hesabınızın uçuşlarını iki grupta listeler. Bu gezi sırasında gezinin içine tarihlenmiş olanları, çoktan işaretli olarak tutar; Diğer uçuşlar geri kalanı, işaretsiz olarak tutar. Gezide zaten olan bir uçuş gri görünür ve İçe aktarıldı ile işaretlidir.",
  'help.guide.airtrail-import.step.3':
    'Her satır havayolu ve uçuş numarasıyla, iki havalimanıyla ve tarihle bir onay kutusudur. Uçuşu almak ya da dışarıda bırakmak için satıra tıklayın; Diğer uçuşlar altındakiler yalnızca siz işaretlerseniz gelir.',
  'help.guide.airtrail-import.step.4':
    'Birbirine bağlanan uçuşlar, her biri bir öncekinin indiği havalimanından bir gün içinde kalkanlar, birlikte çerçevelenir. Altındaki onay kutusu, o havalimanı aktarmalı tek uçuş olarak içe aktar, zaten açıktır: aktarmalı tek bir rezervasyon için açık bırakın ya da etapları ayrı uçuşlar olarak içe aktarmak için kapatın.',
  'help.guide.airtrail-import.step.5':
    'İçe aktar düğmesine tıklayın. Düğme işaretli uçuşları sayar ve sonraki mesaj kaç tanesinin geldiğini söyler.',
  'help.guide.airtrail-import.step.6':
    'Uçuşlar Onaylandı altında kartlardır, her biri durumunun yanında mavi bir AirTrail rozetiyle, ve gittikleri günlerde satırlardır. Birleştirilmiş bir bağlantı tek bir karttır, rotası aktarmadan geçer.',
  'help.guide.airtrail-import.result':
    'AirTrail’den gelen uçuşlar Ulaşım sekmesinde kartlar ve günlerinde satırlardır, her biri nereden geldiğini söyleyen AirTrail rozetini taşır.',
  'help.guide.airtrail-import.tip.1':
    'Aynı numara ve tarihle gezide zaten olan bir uçuş atlanır ve bir mesaj kaç tanesinin atlandığını söyler. Günlerin üstündeki araç çubuğundaki Geri al bütün içe aktarmayı geri alır.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail doğruluk kaynağı olarak kalır. TREK geziyi açtığınızda ve arka planda birkaç dakikada bir onun değişikliklerini okur; orada silinen bir uçuş kartını korur, rozeti Senkronize değil olur. TREK’te yapılan düzenlemeler yalnızca Entegrasyonlar altında Değişiklikleri AirTrail’e geri yaz açıkken geri gider.',
  'help.guide.airtrail-import.tip.3':
    'Birleştirilmiş bir bağlantının izleyeceği tek bir AirTrail uçuşu yoktur, bu yüzden tek seferlik bir içe aktarmadır: mavi rozeti korur ve rozetin üzerine gelmek bunu söyler. Elle bir durak verdiğiniz senkronize bir uçuşa da aynısı olur.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Yol gezisi',
  'help.ctx.trip-roadtrip.summary':
    'Plan tek bir sürüş olarak okunur: aynı günler ve aynı yerler, aralarındaki sürüşle birlikte duraklara dizilmiş, sol sütunda bir şerit halinde ve haritada. Ne kadar uzak ve ne kadar uzun sürdüğünü, deponun nerede bittiğini ve yol boyunca ne olduğunu söyler.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Sol sütunun üstündeki Günler ve Yol gezisi, gün planı ile sürüş arasında geçiş yapar. Hiçbir şey kopyalanmaz ve hiçbir şey değişmez: Günler planı tam olduğu gibi geri verir.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Şeridin başı geziyi toplar: Mesafe, Sürüş süresi ve Duraklar. Altında her gün için bir kart gelir; günün kendi kilometresi, kaç durak için olduğu, neyi aştığı ve bir İz rozeti ile.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Numaralı bir durak, günün var olduğu bir yerdir. Yol üzerindeki bir mola, yakıt, şarj, bir dinlenme alanı, numara yerine kendi türünün simgesini taşır ve sayılmaz. Hangisi olduğunu değiştirmek için numaraya, ne kadar sürdüğünü söylemek için Süre rozetine tıklayın.',
  'help.ctx.trip-roadtrip.bullet.4':
    'İki durak arasında bir sürüş bandı, etabı mesafe ve süre olarak verir. Bu etap için yollar için üzerine tıklayın ya da etabı bir ara noktadan büküp geçirmek için haritada çizili rotaya tıklayın.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Sağ sütun Rota boyunca olur: bir gün seçin, ne arayacağınızı ve koridorun ne kadar geniş olduğunu belirleyin, sonra Ara. Ekle, bir sonucu sürüşün gerçekten geçildiği noktasına koyar.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Altındaki Sürüş ayarları sınırları, aracı ve menzilini, günlük yolculuk saatlerini, nelerden kaçınılacağını ve çizginin nasıl çizileceğini tutar. Geziye aittirler, bu yüzden herkes aynı araçla plan yapar.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Geziyi tek bir sürüş olarak okuyun',
  'help.guide.roadtrip-mode.goal': 'Planı yol gezisi kipine geçirin ve şeridin size ne söylediğini okuyun.',
  'help.guide.roadtrip-mode.step.1':
    'Sol sütunun üstündeki Günler ve Yol gezisi anahtarında Yol gezisi seçeneğine tıklayın. Gün planının yerini sürüş alır ve harita rotası hesaplanmış her günü çizer.',
  'help.guide.roadtrip-mode.step.2': 'Şeridin başı tüm geziyi toplar: Mesafe, Sürüş süresi ve Duraklar.',
  'help.guide.roadtrip-mode.step.3':
    'Altında her gün için bir kart gelir. Başlığı günün numarasını ve tarihini, sürüşü mesafe ve süre olarak ve günün kaç durak için olduğunu taşır.',
  'help.guide.roadtrip-mode.step.4':
    'Kartın içinde gün bir zincirdir: her yer için numaralı bir durak, her çift arasında bir sürüş bandı ve sağ kenarda varış saati.',
  'help.guide.roadtrip-mode.step.5':
    'Bir günü katlamak için başlığına tıklayın. Katlanmış bir gün haritadan da kalkar; geri getirmek için başlığa yeniden tıklayın.',
  'help.guide.roadtrip-mode.result':
    'Sol sütun sürüştür ve harita onun her gününü gösterir. Günler doğrudan plana geri döner, değişmeden.',
  'help.guide.roadtrip-mode.tip.1':
    'Seçim, tarayıcı sekmesi açık kaldığı sürece her gezi için hatırlanır, yani sayfa yenilendiğinde sürüşe geri dönersiniz.',
  'help.guide.roadtrip-mode.tip.2':
    'Anahtar ancak bir yönetici Yönetim içindeki Eklentiler altından Yol gezisi eklentisini açtığında var olur.',
  'help.guide.roadtrip-mode.tip.3': 'Telefonda anahtar yoktur: eklenti Planı yanına kendi Yol gezisi sekmesini ekler.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Yol üzerindeki molalar ve ne kadar kaldığınız',
  'help.guide.roadtrip-stops.goal':
    'Sürüş üzerindeki bir yeri yol üzerinde bir molaya dönüştürün ve her molanın ne kadar sürdüğünü söyleyin.',
  'help.guide.roadtrip-stops.step.1':
    'Şeritte bir durağın önündeki numaraya tıklayın. Etiketi Yol üzerinde molaya dönüştür şeklindedir ve Mola türü penceresini açar.',
  'help.guide.roadtrip-stops.step.2':
    'Bir tür seçin: Konaklama, Yakıt, Şarj, Dinlenme alanı, Kamp alanı, Yemek ya da Görülecek yerler. Numara o türün simgesine döner ve altındaki duraklar yeniden numaralanır.',
  'help.guide.roadtrip-stops.step.3':
    'Yol üzerindeki bir mola varış noktası değildir, bu yüzden günün başlığı bir durak eksik sayar.',
  'help.guide.roadtrip-stops.step.4':
    'Durağa numarasını geri vermek için simgeye yeniden tıklayın, Mola türünü değiştir, ve Yeniden varış noktası yap seçeneğini seçin.',
  'help.guide.roadtrip-stops.step.5':
    'Her durak bir Süre rozeti taşır. Bu duraktaki süre penceresini açmak için ona tıklayın.',
  'help.guide.roadtrip-stops.step.6':
    'Uzunluğu kaydırıcıyla, eksi ve artı düğmeleriyle ya da hazır sürelerden biriyle ayarlayın, Varis ile Kalkis ne yapıyor bakın, sonra Kaydet düğmesine tıklayın.',
  'help.guide.roadtrip-stops.result':
    'Süresini verdiğiniz durak saati Süre rozetinde taşır ve ondan sonraki her varış onunla birlikte kaymıştır, bir türe gönderip geri getirdiğiniz durak ise yeniden numaralı bir varış noktasıdır.',
  'help.guide.roadtrip-stops.tip.1':
    'Mola süresi bir ziyarete değil yere aittir: iki güne planlanmış bir yerde her iki gün de aynı süre durulur.',
  'help.guide.roadtrip-stops.tip.2':
    'Yol üzerindeki molalar Günler içinde de görünür. Sürüş ayarlarındaki Hizmet durakları altında yer alan Günler içinde de göster seçeneğini kapatmak, onları yalnızca Yol gezisinde tutar.',
  'help.guide.roadtrip-stops.tip.3': 'Aynı penceredeki Mola yok, bu süreyi yeniden kaldırır.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Rota boyunca yakıt, yemek ve yatacak yer bulun',
  'help.guide.roadtrip-corridor.goal': 'Gerçekten sürdüğünüz yolu arayın ve bulduğunuzu doğru etaba koyun.',
  'help.guide.roadtrip-corridor.step.1':
    'Rota boyunca bölümünün üstünden günü seçin. Yalnızca rotası hesaplanmış günler sunulur.',
  'help.guide.roadtrip-corridor.step.2':
    'Aranan altında neye ihtiyacınız olduğunu işaretleyin. Yakıt, Şarj, Dinlenme alanı, Kamp alanı, Konaklama, Yemek ve Görülecek yerler birlikte seçilebilir.',
  'help.guide.roadtrip-corridor.step.3':
    'Mesafe altında yolun iki yanında ne kadar uzağa bakılacağını seçin, 2 km, 5 km ya da 10 km, sonra Ara düğmesine tıklayın.',
  'help.guide.roadtrip-corridor.step.4':
    'Sonuçlar türlerine göre gruplanmış olarak, geçtiğiniz sırayla döner; her biri gün içinde ne kadar ileride olduğunu ve rotadan ne kadar uzakta durduğunu taşır.',
  'help.guide.roadtrip-corridor.step.5':
    'Bir sonuçtaki Ekle, Mola olarak ekle penceresini açar. Molanın hangi güne ve hangi sıraya düştüğünü söyler, türü ve duraktaki süreyi sorar, Ekle ise onu sürüşe koyar.',
  'help.guide.roadtrip-corridor.result':
    'Sonuçlar geçtiğiniz sırayla listelenir ve haritada çizilir, eklediğiniz ise sürüşün gerçekten geçildiği noktasında oturur.',
  'help.guide.roadtrip-corridor.tip.1':
    'Ara düğmesine basmadan hiçbir şey aranmaz: tek bir çalıştırma, paylaşılan bir hizmete yapılan birçok istektir.',
  'help.guide.roadtrip-corridor.tip.2':
    'Ada göre süz, yeniden sormadan gelenleri daraltır; Sonuçları temizle ise listeyi ve iğnelerini boşaltır. Bir sonuca tıklayarak onu haritada görüş alanına getirirsiniz.',
  'help.guide.roadtrip-corridor.tip.3':
    'Bir sonuç haritadan çizili rotanın üzerine de sürüklenebilir; aynı yoldan iki kez geçildiğinde etabı böyle kendiniz seçersiniz. Ara düğmesinin yanındaki Elle ekle ise bir yeri adıyla arar.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Bir etabı ara noktadan büküp geçirin',
  'help.guide.roadtrip-via.goal': 'Bir etaba durak eklemeden onu gerçekten istediğiniz yoldan gönderin.',
  'help.guide.roadtrip-via.step.1':
    'İstediğiniz etabı görüş alanına getirin: şeritte bir durağa tıklayın, sonra haritanın üzerinde açılan kartı kapatın.',
  'help.guide.roadtrip-via.step.2':
    'Çizili rotaya tıklayın. Tıkladığınız etaba bir ara nokta bırakılır ve etap onun üzerinden yeniden hesaplanır.',
  'help.guide.roadtrip-via.step.3':
    'Şerit bunu izler: günün başlığı yeni mesafeyi ve sürüş süresini taşır, ara noktadan sonraki her varış onunla birlikte kayar.',
  'help.guide.roadtrip-via.step.4':
    'Tutamacın üzerine gelin, ne yapabileceğini söyler: Rotayı yeniden şekillendirmek için sürükleyin, kaldırmak için sağ tıklayın. Onu başka bir yere sürükleyin, etap yeni noktadan yeniden çizilir.',
  'help.guide.roadtrip-via.step.5': 'Tutamacı kaldırmak için sağ tıklayın. Etap yeniden doğrudan gider.',
  'help.guide.roadtrip-via.result':
    'Etap seçtiğiniz yolu izler, günün mesafesi, sürüş süresi ve varışları onun için yeniden hesaplanır.',
  'help.guide.roadtrip-via.tip.1':
    'Bir ara nokta durak değildir: numarası, mola süresi ve varış saati yoktur ve günün duraklarına sayılmaz.',
  'help.guide.roadtrip-via.tip.2':
    'Tutamaçlar 9. yakınlaştırma düzeyinden itibaren çizilir, bu yüzden tüm geziye göre ayarlanmış bir harita çizgiyi onlarsız gösterir.',
  'help.guide.roadtrip-via.tip.3':
    'Çizili herhangi bir etaptan iki kilometreden uzağa yapılan tıklama yok sayılır, bir uçuşa, trene ya da feribota yapılan tıklama da öyle.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Bir etabı sürmenin başka bir yolunu deneyin',
  'help.guide.roadtrip-alternatives.goal': 'Rota motorunun tek bir bölüm için başka ne sunduğunu görün ve onu alın.',
  'help.guide.roadtrip-alternatives.step.1':
    'Şeritte bir sürüş bandına, iki durak arasındaki etabı mesafe ve süre olarak veren satıra tıklayın. Etiketi Başka yollar şeklindedir.',
  'help.guide.roadtrip-alternatives.step.2':
    'Bu etap için yollar haritanın üzerinde açılır, her yol için bir kayıt, her biri haritada kendi renginde çizili.',
  'help.guide.roadtrip-alternatives.step.3':
    'O yolu yakmak için bir kaydın üzerine gelin. Mevcut sürülen yoldur, En hızlı ise en çabuğu; diğerleri ne kadar daha yavaş olduklarını ya da hangi yol sınıfını dışarıda bıraktıklarını söyler.',
  'help.guide.roadtrip-alternatives.step.4':
    'O yoldan gitmek için bir kayda tıklayın ya da bulunduğunuz yolda kalmak için Kapat düğmesine.',
  'help.guide.roadtrip-alternatives.result':
    'Etap seçtiğiniz yoldan gider, şeridin mesafesi ve ondan sonraki varışlar onunla birlikte değişir.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Başka bir yol seçmek etaba bir ara nokta koyar ve zaten olanların yerini alır; rota motorunun kendi yolunu seçmek onları yeniden kaldırır.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Otoyolsuz, Ucretsiz ve Feribotsuz, kendi hız modeli olan ikinci bir motordan gelir, bu yüzden süreleri diğerleriyle karşılaştırılabilir değildir.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Aracı ve sürüş sınırlarını ayarlayın',
  'help.guide.roadtrip-limits.goal':
    'TREK uygulamasına ne kullandığınızı ve bir seferde ne kadar sürmeye razı olduğunuzu söyleyin.',
  'help.guide.roadtrip-limits.step.1':
    'Sürüş ayarları, sağ sütunda aramanın altında durur. Rozetleri neyin ayarlı olduğunu söyler; açmak için tıklayın.',
  'help.guide.roadtrip-limits.step.2':
    'Sürüş altında Aralıksız en uzun sürüş ve Günlük sürüş dakika cinsindendir. Boş bir alan kapalı demektir ve hiçbir şey işaretlenmez.',
  'help.guide.roadtrip-limits.step.3':
    'Araç altında ne kullandığınızı söyleyin. Benzin yalnızca yakıt duraklarında, Elektrik yalnızca şarj duraklarında, İkisi de her ikisinde doldurur.',
  'help.guide.roadtrip-limits.step.4':
    'Bir depoyla menzil ya da Şarj başına menzil değerini kendiniz yazın. Altındaki Araç verilerinden hesapla, Depo hacmi ile Tüketim değerlerini ya da Batarya ile Tüketim değerlerini alır ve hesabı yapar.',
  'help.guide.roadtrip-limits.step.5':
    'Mümkünse kaçın bir tercihtir, yasak değil: etrafından dolaşacak yolu olmayan bir gün yine de o yolu kullanır ve bunu başlığında söyler.',
  'help.guide.roadtrip-limits.step.6':
    'Pencereyi kapatın. Kart neyin ayarlı olduğunu söyler, şerit ise bunu aşan her etabı ve her günü işaretler.',
  'help.guide.roadtrip-limits.result':
    'Kartın rozetleri neyin ayarlı olduğunu söyler ve bir sınırı aşan her etap ile her gün şeritte bir rozet taşır.',
  'help.guide.roadtrip-limits.tip.1':
    'Ayarlar geziye aittir, bu yüzden gezideki herkes aynı araç ve aynı sınırlarla plan yapar.',
  'help.guide.roadtrip-limits.tip.2':
    'Şu kadar doldur, bir durağın ne kadar doldurduğunu söyler, çünkü kimse yolda %100 şarj etmez. Bir yakıt ya da şarj durağı bunu kendisi için geçersiz kılabilir.',
  'help.guide.roadtrip-limits.tip.3':
    'Rota çizgisi sürüşün nasıl çizileceğine karar verir: Günleri birleştir iki gün arasındaki geceyi rotalar, Her güne bir renk ise her güne kendi rengini verir.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Sürüş gününe bir başlangıç ve bir bitiş verin',
  'help.guide.roadtrip-day-window.goal':
    'Seçtiğiniz saatte sürmeyi bırakın ve günün nerede bitmesi gerektiğini söyleyin.',
  'help.guide.roadtrip-day-window.step.1':
    'Sağ sütunda Sürüş ayarları penceresini açın ve Günlük yolculuk saatleri bölümünü bulun.',
  'help.guide.roadtrip-day-window.step.2':
    'Bir Gün başlangıcı ayarlayın. Tek başına hiçbir şey yapmaz: altlarındaki notun söylediği gibi iki saat de gerekir.',
  'help.guide.roadtrip-day-window.step.3':
    'Bir Gün bitişi ayarlayın. Sürüş artık o saatte durur ve kalanı ertesi sabaha taşır; şeritte bir Gün sonu satırı ve bir Yolculuğa devam et satırı olarak.',
  'help.guide.roadtrip-day-window.step.4':
    'Günü bitir altında, bitiş saatinde yolda duraklamak için Rota üzerinde seçeneğini, sıradaki sürüşün onu geçeceği ana kadar beklemeden durmak için Son yerde seçeneğini seçin.',
  'help.guide.roadtrip-day-window.step.5': 'Pencereyi kapatın. Sürüş ayarları kartı iki saati bir rozet olarak taşır.',
  'help.guide.roadtrip-day-window.result':
    'Sürüş, belirlediğiniz uzunlukta yolculuk günlerine bölünür ve sığmayan kısım sonuncudan sonraki hesaplanmış günlerde devam eder. Günleriniz ve onların yerleri değişmez.',
  'help.guide.roadtrip-day-window.tip.1':
    'İki saatten birini temizlemek her şeyi yeniden kapatır. Bir durakta kendiniz sabitlediğiniz saatler her zaman önceliklidir.',
  'help.guide.roadtrip-day-window.tip.2':
    'Günlük yolculuk saatleri ayarlıyken günler her zaman bağlıdır: bir günün son durağından ertesi günün ilkine olan sürüş rotalanır ve sayılır.',
  'help.guide.roadtrip-day-window.tip.3':
    'Her gün sonu haritada da bir işaretçidir, gün numarasını taşıyan bir ay. Günü başka bir yerde bitirmek için onu rota boyunca ya da bir yerin üzerine sürükleyin; otomatik bitişi geri koymak için sağ tıklayın, bu penceredeki Otomatik gün sonlarını geri yükle ise hepsini geri alır.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Depo bitmeden yakıt alın',
  'help.guide.roadtrip-refuel.goal': 'Aracın hâlâ ulaşabildiği bölümde yakıt alacak bir yer bulun ve onu sürüşe koyun.',
  'help.guide.roadtrip-refuel.step.1':
    'Bir menzil ayarlıyken şerit, etabın bittiği yere bir bant çizer: Depo burada bitiyor, altında da bunun etabın ne kadar içinde olduğu.',
  'help.guide.roadtrip-refuel.step.2':
    'Banttaki lamba düğmedir. Yakıt bul, zaten sürdüğünüz yol boyunca bakar ve bunu yaparken Rota boyunca aranıyor… der.',
  'help.guide.roadtrip-refuel.step.3':
    'En fazla üç istasyon döner; her biri rotadan ne kadar uzakta olduğunu ve geriye ne kadar menzil bırakacağını taşır.',
  'help.guide.roadtrip-refuel.step.4':
    'Bir tekliftaki artı onu yakıt molası olarak ekler. Mola olarak ekle, türü ve süresi çoktan doldurulmuş olarak açılır, Ekle ise onu etabın gerçekten geçildiği noktasına koyar.',
  'help.guide.roadtrip-refuel.result':
    'Durak kendi simgesiyle doğru etapta durur, menzil ondan itibaren yeniden sayılır ve bant kaybolur.',
  'help.guide.roadtrip-refuel.tip.1':
    'Menzil, günler boyunca son yakıt ya da şarj durağından itibaren sayılır. Ne kullandığınız hangi durakların sayıldığına karar verir: Benzin yalnızca yakıt, Elektrik yalnızca şarj.',
  'help.guide.roadtrip-refuel.tip.2':
    'Arama, kuru noktadan önceki yola bakar, bir yedek bırakır ve sapmayı iki kez sayar, böylece sunduğu her şeye gerçekten ulaşılabilir.',
  'help.guide.roadtrip-refuel.tip.3':
    'Boş bir yanıt çıkmaz sokak değildir: lamba Yeniden dene olur, çünkü yer araması zaman aşımına uğrayabilen paylaşılan bir hizmettir.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Bir günü içe aktarılmış bir ize uydurun',
  'help.guide.roadtrip-track.goal':
    'Bir günün sürüşünü, GPX ya da KML izi olarak içe aktardığınız manzaralı bir rotanın üzerine koyun.',
  'help.guide.roadtrip-track.step.1': 'Bir günün başlığındaki İz rozetine tıklayın. Pencere o günde açılır.',
  'help.guide.roadtrip-track.step.2':
    'Bir iz seçin. Her biri ne kadar uzun olduğunu ve bu gün boyunca mı uzandığını yoksa ne kadar uzakta durduğunu söyler, en yakın olan önce.',
  'help.guide.roadtrip-track.step.3':
    'Bu izi takip et düğmesine tıklayın. TREK, sürüşün izden en çok saptığı yerlere ara noktalar bırakır ve tur tur yeniden rotalar.',
  'help.guide.roadtrip-track.step.4':
    'Kaç ara nokta yerleştirdiğini ve sürüşün artık ne kadar yakın kaldığını söyler. Altındaki düğme o ara noktaları yeniden kaldırır ve günü rota motoruna geri verir; pencereyi kapatmak izi korur.',
  'help.guide.roadtrip-track.result':
    'Günün sürüşü, rota motorunun seçtiği yol yerine izi takip eder ve İz rozeti yanar, üzerine geldiğinizde o izin adını verir.',
  'help.guide.roadtrip-track.tip.1':
    'Dosyayı Günler altında Dosyayı içe aktar ile, Rotalar ya da İzler işaretli olarak içe aktarın. Gezi bir tane tutana kadar hiçbir gün rozeti taşımaz.',
  'help.guide.roadtrip-track.tip.2':
    'Bir izi takip etmek, günün etaplarının zaten sahip olduğu ara noktaların yerini alır, bu yüzden bir etabı elle izden sonra şekillendirin, önce değil.',
};

export default help;
