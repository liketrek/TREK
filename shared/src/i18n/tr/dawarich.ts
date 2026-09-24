import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Gerçekte nerelere gittiğinizi görmek için kendi Dawarich sunucunuzu bağlayın. TREK bu kayıtları okur ve günlük kayıtları, yerler ve ülkeler önerir — siz onaylamadan hiçbir şey eklenmez ve Dawarich’e hiçbir şey geri yazılmaz.',
  'dawarich.url': 'Sunucu adresi',
  'dawarich.apiKey': 'API anahtarı',
  'dawarich.apiKeyPlaceholder': 'Dawarich API anahtarınızı yapıştırın',
  'dawarich.apiKeyHint':
    'Dawarich’te Hesap → API anahtarı altında bulunur. Şifreli olarak saklanır ve bir daha gösterilmez.',
  'dawarich.allowInsecureTls': 'Kendinden imzalı sertifikaya izin ver',
  'dawarich.allowInsecureTlsHint':
    'Yalnızca sunucunuzun güvenmediği bir sertifika kullanan bir örnek için gerekir.',
  'dawarich.syncEnabled': 'Yeni konaklamaları otomatik olarak denetle',
  'dawarich.syncEnabledHint': 'Kapalıyken TREK, Dawarich’i yalnızca siz istediğinizde okur.',
  'dawarich.test.button': 'Bağlantıyı test et',
  'dawarich.test.success': 'Bağlandı. Son 30 günde {count} konaklama bulundu.',
  'dawarich.test.failed': 'Dawarich’e ulaşılamadı.',
  'dawarich.syncNow': 'Şimdi denetle',
  'dawarich.connected': 'Bağlandı',
  'dawarich.notConnected': 'Bağlı değil',
  'dawarich.disconnect': 'Bağlantıyı kes',
  'dawarich.lastSync': 'Son denetim {when}',
  'dawarich.neverSynced': 'Henüz denetlenmedi',
  'dawarich.syncPartial': 'bazı geziler okunamadı',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Dawarich bağlantısı kaydedildi',
  'dawarich.toast.saveError': 'Bağlantı kaydedilemedi',
  'dawarich.toast.disconnected': 'Dawarich bağlantısı kesildi',
  'dawarich.toast.synced': '{count} yeni konaklama bulundu',
  'dawarich.toast.syncError': 'Dawarich okunamadı',
  'dawarich.toast.syncRunning': 'Zaten bir kontrol çalışıyor',
  'dawarich.toast.acceptError': 'Bu eklenemedi',
  'dawarich.toast.updateError': 'Bu öneri güncellenemedi',
  'dawarich.toast.accepted.place': 'Geziye eklendi',
  'dawarich.toast.accepted.journal': 'Günlüğe eklendi',
  'dawarich.toast.accepted.bucket_list': 'Dilek listenizden işaretlendi',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'konaklamalar',
  'dawarich.capability.track': 'kaydedilen rota',
  'dawarich.capability.locations': 'dilek listesi eşleştirme',
  'dawarich.capability.visitedCities': 'ülkeler ve şehirler',
  'dawarich.capability.missing': 'Bu Dawarich sürümü şunları sunmuyor: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK bu adrese ulaşamadı.',
  'dawarich.error.unauthorized': 'Dawarich API anahtarını reddetti.',
  'dawarich.error.forbidden': 'Bu API anahtarının bunu okuma izni yok.',
  'dawarich.error.not_found': 'Bu Dawarich sürümünde böyle bir uç nokta yok.',
  'dawarich.error.rate_limited': 'Dawarich, TREK’ten yavaşlamasını istedi. Birazdan yeniden deneyin.',
  'dawarich.error.server_error': 'Dawarich bir hatayla yanıt verdi.',
  'dawarich.error.invalid_response': 'Bu adres, Dawarich olmayan bir şeyle yanıt verdi.',
  'dawarich.error.too_large': 'Dawarich, TREK’in bir kerede okuyacağından daha fazla veri gönderdi.',
  'dawarich.error.not_connected': 'Henüz bağlı bir Dawarich sunucusu yok.',
  'dawarich.error.addon_disabled': 'Dawarich eklentisi bu örnek için kapalı.',
  'dawarich.error.offline': 'Bunun için bağlantı gerekiyor — TREK şu anda çevrimdışı.',
  'dawarich.error.invalid_url': 'TREK bu adresi kullanamıyor.',
  'dawarich.warning.private_ip': 'Bu adres özel bir IP’ye çıkıyor ({ip}). Böyle olmasını istediğinden emin ol — sunucunun buna erişmesi için ALLOW_INTERNAL_NETWORK=true gerekebilir.',
  'dawarich.error.unknown': 'Dawarich ile iletişimde bir şeyler ters gitti.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Kaydedilen rotayı göster',
  'dawarich.trail.hide': 'Kaydedilen rotayı gizle',
  'dawarich.trail.loading': 'Kaydedilen rota yükleniyor…',
  'dawarich.trail.empty': 'Bu tarihlerde hiçbir şey kaydedilmemiş',
  'dawarich.trail.offline': 'Kaydedilen rota için bağlantı gerekir',
  'dawarich.trail.unavailable': 'Kaydedilen rota yüklenemedi',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} dk',
  'dawarich.duration.hours': '{hours} sa',
  'dawarich.duration.hoursMinutes': '{hours} sa {minutes} dk',
  'dawarich.checkedAgo': '{ago} kontrol edildi',

  'dawarich.badge.lowConfidence': 'Belirsiz',
  'dawarich.badge.sourceChanged': 'Dawarich’te değişti',
  'dawarich.badge.sourceMissing': 'Dawarich’ten kayboldu',

  'dawarich.suggestions.title': 'Dawarich’ten',
  'dawarich.suggestions.pending': '{count} tanesi sizi bekliyor',
  'dawarich.suggestions.loading': 'Dawarich okunuyor…',
  'dawarich.suggestions.notConnected':
    'Konaklamalarınızı burada görmek için Ayarlar’dan Dawarich’i bağlayın.',
  'dawarich.suggestions.unavailable': 'Dawarich okunamadı.',
  'dawarich.suggestions.allHandled': 'Burada kaydedilen her şey ele alındı.',
  'dawarich.suggestions.asJournal': 'Günlük kaydı yaz',
  'dawarich.suggestions.asPlace': 'Yer olarak ekle',
  'dawarich.suggestions.dismiss': 'Ziyaret ettiğim bir yer değil',
  'dawarich.suggestions.dismissed': 'Yok sayıldı',
  'dawarich.suggestions.restore': 'Geri koy',
  'dawarich.suggestions.showHandled': 'Ele alınmış {count} tanesini göster',
  'dawarich.suggestions.hideHandled': 'Ele alınmış olanları gizle',
  'dawarich.suggestions.matchesWish': 'Dilek listenizde: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Yer olarak eklendi',
  'dawarich.suggestions.acceptedAs.journal': 'Günlükte',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Dilek işaretlendi',
  'dawarich.suggestions.sourceChanged':
    'Bu konaklama, siz kullandıktan sonra Dawarich’te değişti. TREK’te yazdıklarınıza dokunulmadı.',
  'dawarich.suggestions.sourceMissing':
    'Bu konaklama artık Dawarich’te yok. TREK’te yazdıklarınıza dokunulmadı.',
  'dawarich.sourceStatus.suggested': 'Algılandı, onaylanmadı',
  'dawarich.confidence.high': 'Kesine yakın algılama',
  'dawarich.confidence.medium': 'Oldukça güvenilir algılama',
  'dawarich.confidence.low': 'Belirsiz algılama',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Bu konaklamayı yer olarak ekle',
  'dawarich.accept.title.journal': 'Günlük kaydı yaz',
  'dawarich.accept.title.bucket_list': 'Bir dileği işaretle',
  'dawarich.accept.confirm.place': 'Yer ekle',
  'dawarich.accept.confirm.journal': 'Kayıt ekle',
  'dawarich.accept.confirm.bucket_list': 'İşaretle',
  'dawarich.accept.recorded': '{from} ile {to} arasında kaydedildi',
  'dawarich.accept.duration': '{minutes} dk',
  'dawarich.accept.name': 'Ad',
  'dawarich.accept.date': 'Tarih',
  'dawarich.accept.from': 'Varış',
  'dawarich.accept.to': 'Ayrılış',
  'dawarich.accept.trip': 'Gezi',
  'dawarich.accept.thisTrip': 'Bu gezi',
  'dawarich.accept.pickTrip': 'Bir gezi seçin',
  'dawarich.accept.day': 'Gün',
  'dawarich.accept.noDay': 'Henüz bir güne bağlı değil',
  'dawarich.accept.journal': 'Günlük',
  'dawarich.accept.pickJournal': 'Bir günlük seçin',
  'dawarich.accept.notes': 'Notlar',
  'dawarich.accept.story': 'Hikâyeniz',
  'dawarich.accept.storyPlaceholder': 'Burada neler oldu?',
  'dawarich.accept.photosHint': 'Kayıt oluşturulduktan sonra fotoğraf ekleyebilirsiniz.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Dawarich kayıtlarından eklendi',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Dilek listenizi Dawarich ile karşılaştırın',
  'dawarich.bucket.description':
    'Ulaşmak istediğiniz yerler için kayıtlarınıza bakar. Bir ziyaret hem yakınlık hem de orada geçirilen süre ister — yanından geçmek sayılmaz.',
  'dawarich.bucket.scan': 'Dilek listesini denetle',
  'dawarich.bucket.scanning': 'Denetleniyor…',
  'dawarich.bucket.noMatches': 'Dilek listenizden hiçbir şey kayıtlarınızda çıkmadı.',
  'dawarich.bucket.alreadyVisited': 'Zaten işaretlenmiş',
  'dawarich.bucket.confirm': '{count} tanesini işaretle',
  'dawarich.bucket.confirmed': '{count} dilek işaretlendi',
  'dawarich.bucket.skipped': '{count} kaydın koordinatı yok, denetlenemedi.',
  'dawarich.bucket.truncated': 'Yalnızca ilk kayıtlar denetlendi. Kalanı için yeniden çalıştırın.',
  'dawarich.bucket.visitedFrom': 'Dawarich kayıtlarınızdan işaretlendi',
  'dawarich.bucket.clearVisit': 'Geri al',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Dawarich’ten gelen ülkeler',
  'dawarich.atlas.description':
    'Kayıtlarınıza göre bulunduğunuz ülkeler. Atlas’ınızda görmek istediklerinizi onaylayın — hiçbir şey kendiliğinden eklenmez ve elle işaretlediğiniz her şey size ait kalır.',
  'dawarich.atlas.load': 'Ülkeleri ara',
  'dawarich.atlas.loading': 'Kayıtlarınız okunuyor…',
  'dawarich.atlas.empty': 'Kayıtlarınız, TREK’te halihazırda olmayan bir ülke göstermiyor.',
  'dawarich.atlas.cities': '{count} şehir',
  'dawarich.atlas.citiesOne': '1 şehir',
  'dawarich.atlas.accept': '{count} ülke ekle',
  'dawarich.atlas.accepted': '{count} ülke eklendi',
  'dawarich.atlas.unresolved': 'TREK bunları bir ülkeyle eşleştiremedi: {names}.',
  'dawarich.atlas.source': 'Dawarich’ten',
  'dawarich.atlas.range': '{from} ile {to} arası incelendi',

  'dawarich.atlas.trigger': 'Kayıtlarından gelen dilekler ve ülkeler',
  'dawarich.atlas.dialogSubtitle': 'Kayıtların Atlas’ın hakkında ne söylüyor',
  'dawarich.atlas.tab.wishes': 'Dilek listesi',
  'dawarich.atlas.tab.countries': 'Ülkeler',
  'dawarich.atlas.window': 'Son 12 ay incelendi.',
  'dawarich.selected': '{count} seçildi',
  'dawarich.again': 'Yeniden kontrol et',
  'dawarich.bucket.metersAway': '{meters} m uzakta',
  'dawarich.bucket.kilometersAway': '{km} km uzakta',
  'dawarich.bucket.rule': 'Bir dilek {meters} m yakınlıkta ve yerinde {minutes} dakika sonra ulaşılmış sayılır.',

  'dawarich.journey.dayStays.one': "Dawarich'ten 1 durak",
  'dawarich.journey.dayStays.other': "Dawarich'ten {count} durak",
};

export default dawarich;
