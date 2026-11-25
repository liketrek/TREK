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
  'system_notice.thank_you_support.cta_patreon': "Patreon'da Aylık Destek",
  'system_notice.pager.prev': 'Önceki bildirim',
  'system_notice.pager.next': 'Sonraki bildirim',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '{n}. bildirime git',
  'system_notice.pager.position': '{total} Bildirimden {current}.',
  'system_notice.release_notes.eyebrow': 'Güncelleme yüklendi',
  'system_notice.release_notes.features_label': 'Öne çıkanlar',
  'system_notice.release_notes.features_aside': 'Hepsi bu kadar değil',
  'system_notice.release_notes.feature_mail_title': 'Rezervasyon e-postaları gezine düşer',
  'system_notice.release_notes.feature_mail_body':
    'Bir onay e-postasını yönlendir, TREK rezervasyonu doğru geziye ekler.',
  'system_notice.release_notes.feature_flight_title': 'Canlı uçuş durumu, ücretsiz',
  'system_notice.release_notes.feature_flight_body': 'Durum, gecikmeler ve haritada uçak, API anahtarı olmadan.',
  'system_notice.release_notes.feature_pdf_title': "Yeni gezi PDF'i",
  'system_notice.release_notes.feature_pdf_body': 'Rotan, her gün ve tüm rezervasyonların, yazdırmaya hazır.',
  'system_notice.release_notes.footnote':
    'Ayrıca PostgreSQL, gezi başına eklentiler, yerlere etiketler ve birçok küçük değişiklik.',
  'system_notice.release_notes.notes_label': 'Sürüm notları',
  'system_notice.release_notes.note_eyebrow': 'Geliştiriciden bir not',
  'system_notice.release_notes.note_title': "TREK'i geliştirmeye devam etmemin sebebi sensin.",
  'system_notice.release_notes.note_body':
    'TREK, kendi gezilerim için işten sonra yaptığım küçük bir araç olarak başladı. Bugün kullandığın hemen her şey gece geç saatlerde, hafta sonlarında ya da trenlerde, tam zamanlı bir işin yanında ortaya çıktı ve çoğu zaman biri onu açar mı diye merak ettim.',
  'system_notice.release_notes.promise_label': 'Söz',
  'system_notice.release_notes.promise_lead': 'TREK sonsuza dek ücretsiz kalacak.',
  'system_notice.release_notes.promise_text':
    'Her özellik, her güncelleme, herkes için. Ücretli paket yok, abonelik yok, gizli şart yok.',
  'system_notice.release_notes.note_body_after':
    "Sonra siz geldiniz, binlerce kişi: yıldızlarla, hata bildirimleriyle, çevirilerle ve hiç tanımadığım insanların pull request'leriyle. Hâlâ tam gerçek gibi gelmiyor.",
  'system_notice.release_notes.note_closing': 'Burada olduğun için teşekkür ederim. Maurice',
  'system_notice.release_notes.support_label': 'Sizin sayenizde',
  'system_notice.release_notes.support_lead': 'TREK yalnızca bağışlar sayesinde var.',
  'system_notice.release_notes.support_text':
    "Bağışlar sunucuların faturasını ödüyor ve bana geliştirmeye devam edecek zaman veriyor. Tek bir kahve bile TREK'in herkes için ücretsiz kalmasına yardım eder.",
  'system_notice.release_notes.cta_bmc': 'Bana bir kahve ısmarla',
  'system_notice.release_notes.cta_kofi': "Ko-fi'de Destek Ol",
  'system_notice.release_notes.cta_patreon': "Patreon'da Aylık Destek",
  'system_notice.release_notes.apps_title': 'TREK artık telefonunda',
  'system_notice.release_notes.headline': 'Daha az yazmak, daha çok gezmek.',
  'system_notice.release_notes.intro':
    "Yönlendirdiğin rezervasyon e-postaları gezine düşüyor, TREK uçuşlarını canlı takip ediyor ve gezi PDF'i baştan yepyeni.",
};
export default system_notice;
