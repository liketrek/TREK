import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': "Fotoğraflar 3.0'da taşındı",
  'system_notice.v3_photos.body':
    "Seyahat Planlayıcı'daki **Fotoğraflar** kaldırıldı. Fotoğraflarınız güvende — TREK Immich veya Synology kütüphanenizi asla değiştirmedi.\\n\\nFotoğraflar artık **Journey** eklentisinde. Journey isteğe bağlıdır — henüz kullanılamıyorsa yöneticinizden Yönetici → Eklentiler bölümünden etkinleştirmesini isteyin.",
  'system_notice.v3_journey.title': 'Journey ile tanışın — seyahat günlüğü',
  'system_notice.v3_journey.body':
    'Seyahatlerinizi zaman çizelgeleri, fotoğraf galerileri ve etkileşimli haritalarla zengin hikâyelere dönüştürün.',
  'system_notice.v3_journey.cta_label': "Journey'i Aç",
  'system_notice.v3_journey.highlight_timeline': 'Gün gün zaman çizelgesi ve galeri',
  'system_notice.v3_journey.highlight_photos': "Immich veya Synology'den içe Aktar",
  'system_notice.v3_journey.highlight_share': 'Herkese açık paylaş — giriş gerekmez',
  'system_notice.v3_journey.highlight_export': 'PDF fotoğraf kitabı Olarak dışa aktar',
  'system_notice.v3_features.title': "3.0'Daki diğer öne çıkanlar",
  'system_notice.v3_features.body': 'Bu sürüm hakkında bilmeniz gereken birkaç şey daha.',
  'system_notice.v3_features.highlight_dashboard': 'Mobil öncelikli gösterge paneli yenilemesi',
  'system_notice.v3_features.highlight_offline': 'PWA olarak tam çevrimdışı mod',
  'system_notice.v3_features.highlight_search': 'Gerçek zamanlı yer arama otomatik tamamlama',
  'system_notice.v3_features.highlight_import': 'KMZ/KML dosyalarından yer İçe aktarma',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 yükseltmesi',
  'system_notice.v3_mcp.body':
    'MCP entegrasyonu tamamen yenilendi. OAuth 2.1 artık önerilen kimlik doğrulama yöntemidir. Eski statik jetonlar (trek_…) kullanımdan kaldırıldı ve gelecekteki bir sürümde kaldırılacak.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 önerilir (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 ayrıntılı izin kapsamı',
  'system_notice.v3_mcp.highlight_deprecated': 'Statik trek_ jetonları kullanımdan kaldırıldı',
  'system_notice.v3_mcp.highlight_tools': 'Genişletilmiş araç seti ve istemler',
  'system_notice.v3_thankyou.title': 'Benden kişisel bir not',
  'system_notice.v3_thankyou.body':
    "Before you go — I want to take a moment.\n\nTREK started as a side project I built for my own trips. I never imagined it would grow into something that 4,000 of you now trust to plan your adventures. Every star, every issue, every feature request — I read them all, and they keep me going through late nights between a full-time job and university.\n\nI want you to know: TREK will always be open source, always self-hosted, always yours. No tracking, no subscriptions, no strings attached. Just a tool built by someone who loves traveling as much as you do.\n\nSpecial thanks to [jubnl](https://github.com/jubnl) — you have become an incredible collaborator. So much of what makes 3.0 great carries your fingerprints. Thank you for believing in this project when it was still rough around the edges.\n\nAnd to every single one of you who filed a bug, translated a string, shared TREK with a friend, or simply used it to plan a trip — **thank you**. You are the reason this exists.\n\nHere's to many more adventures together.\n\n— Maurice\n\n---\n\n[Join the community on Discord](https://discord.gg/7Q6M6jDwzf)\n\nIf TREK makes your travels better, a [small coffee](https://ko-fi.com/mauriceboe) always keeps the lights on.",
  'system_notice.v3014_whitespace_collision.title': 'İşlem gerekli: kullanıcı hesabı çakışması',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 yükseltmesi, kayıtlı hesaplardaki baştaki/sondaki boşluklardan kaynaklanan bir veya daha fazla kullanıcı adı veya e-posta çakışması tespit etti. Etkilenen hesaplar otomatik olarak yeniden adlandırıldı. Hangi hesapların incelenmesi gerektiğini belirlemek için sunucu günlüklerinde **[migration] WHITESPACE COLLISION** ile başlayan satırlara bakın.',
  'system_notice.welcome_v1.title': "TREK'e hoş Geldiniz",
  'system_notice.welcome_v1.body':
    'Hepsi bir arada seyahat planlayıcınız. Program oluşturun, seyahatleri arkadaşlarınızla paylaşın ve çevrimiçi veya çevrimdışı düzenli kalın.',
  'system_notice.welcome_v1.cta_label': 'Seyahat planla',
  'system_notice.welcome_v1.hero_alt': 'TREK planlama arayüzü kaplamalı manzaralı bir seyahat destinasyonu',
  'system_notice.welcome_v1.highlight_plan': 'Her seyahat için gün gün programlar',
  'system_notice.welcome_v1.highlight_share': 'Seyahat partnerleriyle işbirliği',
  'system_notice.welcome_v1.highlight_offline': 'Mobilde çevrimdışı çalışır',
  'system_notice.dev_test_modal.title': '[Dev] Test bildirimi',
  'system_notice.dev_test_modal.body': 'Bu yalnızca geliştirme ortamına özel bir test bildirimidir.',
  'system_notice.thank_you_support.title': "TREK'i kullandığınız için teşekkürler",
  'system_notice.thank_you_support.body':
    "TREK'i yüklediğin için kısaca teşekkür etmek istiyorum — bu benim için gerçekten çok değerli.\n\nTek başına çalışan bir geliştiriciyim ve TREK'i boş zamanlarımda geliştiriyorum. Başlangıçta yalnızca kendi seyahatlerim için yaptığım küçük bir araçtı; o günden beri topluluktan gelen destek ve ilgi beni gerçekten hayrete düşürdü. TREK'i kendi adıma büyük bir sevgiyle hazırlıyorum — ama ona şekil vermeye yardım eden onca harika dış katkıcının da büyük payı var.\n\n**TREK açık kaynaklı ve tamamen ücretsiz — ve sonsuza dek böyle kalacak. Ücretli paketler yok, abonelikler yok, gizli bir şart yok. Söz veriyorum.**\n\nTREK işine yarıyorsa ve gelişimine destek olmak istersen, küçük bir kahve geliştirmeye devam etmeme cidden yardımcı oluyor — hiçbir baskı yok ama her fincan, o geç saatlere kadar süren çalışmaları ayakta tutuyor.\n\nBurada olduğun için teşekkür ederim.\n\n— Maurice",
  'system_notice.thank_you_support.highlight_opensource': "GitHub'da %100 açık kaynak",
  'system_notice.thank_you_support.highlight_free': 'Sonsuza dek ücretsiz — hiçbir ücretli plan yok',
  'system_notice.thank_you_support.highlight_community': 'Toplulukla birlikte geliştirildi',
  'system_notice.thank_you_support.cta_bmc': 'Bana bir kahve ısmarla',
  'system_notice.thank_you_support.cta_kofi': "Ko-fi'de Destek Ol",
  'system_notice.pager.prev': 'Önceki bildirim',
  'system_notice.pager.next': 'Sonraki bildirim',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '{n}. bildirime git',
  'system_notice.pager.position': '{total} Bildirimden {current}.',
  'system_notice.release_notes.eyebrow': 'Güncelleme yüklendi',
  'system_notice.release_notes.features_label': 'Öne çıkanlar',
  'system_notice.release_notes.features_aside': 'Hepsi bu kadar değil',
  'system_notice.release_notes.feature_search_title': 'İsabetli yer arama',
  'system_notice.release_notes.feature_search_body':
    'Şehirler, adalar, simge yapılar ve koduyla aranan havalimanları önce gelir, kafeler çevrenizden gelir ve öneriler siz yazarken belirir.',
  'system_notice.release_notes.feature_share_title': 'Paylaşılan yer ayrıntıları',
  'system_notice.release_notes.feature_share_body':
    'Web sitelerini, çalışma saatlerini ve fotoğrafları alan alan her TREK ile paylaşın, kayıtlı yerleriniz de başkalarının eklediklerini alır.',
  'system_notice.release_notes.feature_routing_title': 'Daha hızlı rota hesaplama',
  'system_notice.release_notes.feature_routing_body':
    'Bütün bir gün, yirmi durağa kadar tek seferde hesaplanır, yavaş bir rota artık diğerlerini bekletmez ve toplu taşıma, ilk sağlayıcı bir şey bulamazsa ikinci bir sağlayıcıya sorar.',
  'system_notice.release_notes.footnote':
    "Ayrıca TREK'in geri kalanına yayılmış, daha küçük değişikliklerden oluşan uzun bir liste var.",
  'system_notice.release_notes.notes_label': 'Sürüm notları',
  'system_notice.release_notes.note_eyebrow': 'Geliştiriciden bir not',
  'system_notice.release_notes.note_title': "TREK'i geliştirmeye devam etmemin sebebi sensin.",
  'system_notice.release_notes.note_body':
    'TREK, kendi seyahatlerim için küçük bir araç olarak başladı. Onları daha iyi planlamak istediğim için iş çıkışlarında yazıyordum. O günden beri de büyümeyi hiç tam olarak bırakmadı. Kullandığın neredeyse her şey gece geç saatlerde, hafta sonlarında, trenlerde, tam zamanlı bir işin yanında yapıldı ve birinin onu bir gün gerçekten açıp açmayacağını içten içe merak ettiğim çok akşam oldu.',
  'system_notice.release_notes.promise_label': 'Söz',
  'system_notice.release_notes.promise_lead': 'TREK sonsuza dek ücretsiz kalacak.',
  'system_notice.release_notes.promise_text':
    'Her özellik, her güncelleme, herkes için. Ücretli paket yok, abonelik yok, gizli şart yok.',
  'system_notice.release_notes.note_body_after':
    "Sonra sizler açtınız. Birkaç ay içinde sayınız binleri buldu: yıldızlar, hata bildirimleri, konuşmadığım dillere çeviriler, hiç tanışmadığım insanlardan pull request'ler. Hâlâ her sabah ilk iş repoya bakıyorum ve bu hâlâ tam olarak gerçekmiş gibi gelmiyor.",
  'system_notice.release_notes.note_closing': 'Burada olduğun için teşekkür ederim. Sevgiler, Maurice.',
  'system_notice.release_notes.support_label': 'Bağımsız kalmak',
  'system_notice.release_notes.support_lead': 'Google ve benzerleri olmadan.',
  'system_notice.release_notes.support_text':
    "Yer arama, adres arama ve rota hesaplama TREK'in kendi sunucularında çalışıyor, bugün dataforest cloud sponsorluğunda. Bunun için her gün mücadele ediyorum ve böyle kalması sizin desteğinize bağlı.",
  'system_notice.release_notes.cta_bmc': 'Bana bir kahve ısmarla',
  'system_notice.release_notes.cta_kofi': "Ko-fi'de Destek Ol",
  'system_notice.release_notes.headline': 'Önce doğru yer.',
  'system_notice.release_notes.intro':
    "Yer arama, adres arama ve rota hesaplama artık dataforest cloud sponsorluğunda TREK'in kendi sunucularında çalışıyor ve her TREK, yerler hakkında bildiklerini diğer tüm TREK'lerle paylaşabiliyor.",
};
export default system_notice;
