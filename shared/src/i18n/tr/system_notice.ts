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
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': "Ko-fi'de Destek Ol",
  'system_notice.pager.prev': 'Önceki bildirim',
  'system_notice.pager.next': 'Sonraki bildirim',
  'system_notice.pager.counter': '{güncel} / {toplam}',
  'system_notice.pager.goto': '{n}. bildirime git',
  'system_notice.pager.position': '{total} Bildirimden {current}.',
};
export default system_notice;
