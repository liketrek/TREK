import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Belge eşitleme',
  'docsync.noProviders': 'Kullanılabilir belge sağlayıcısı yok',
  'docsync.noProvidersHint': 'Bunları bir kurulum yöneticisi Yönetim, Eklentiler, Belgeler altından açar.',
  'docsync.addProvider': 'Sağlayıcı bağla',
  'docsync.test': 'Bağlantıyı test et',
  'docsync.connect.optional': 'İsteğe bağlı',
  'docsync.connected': 'Bağlandı',
  'docsync.chooseFolder': 'Klasör seç',
  'docsync.noFolders': 'Bu kurulumda henüz bir şey bulunamadı.',
  'docsync.newFolderPlaceholder': 'Yeni klasör adı',
  'docsync.syncNow': 'Şimdi eşitle',
  'docsync.unlink': 'Bağlantıyı kes',
  'docsync.confirmUnlink': 'Belgeler hem TREK’te hem depoda kalır. Yalnızca aralarındaki eşleştirme kaldırılır.',
  'docsync.syncEnabled': 'Otomatik eşitle',
  'docsync.deletePolicy': 'Bir belge silindiğinde',
  'docsync.deleteUnlink': 'İki kopyayı da tut',
  'docsync.deleteTrash': 'Geri dönüşüm kutusuna taşı',
  'docsync.conflictPolicy': 'İki taraf da değiştiğinde',
  'docsync.onConflict.manual': 'Bana sor',
  'docsync.onConflict.trek_wins': 'TREK kopyasını tut',
  'docsync.onConflict.provider_wins': 'Depodaki kopyayı tut',
  'docsync.webhookHint':
    'Değişikliklerin hemen ulaşması için bu URL’yi sağlayıcınıza yapıştırın. Bu olmadan TREK belirli aralıklarla denetler.',

  // Bağlantı formunun alanları. Anahtarlar, metin yerine bir anahtar soneki
  // tutan document_provider_fields tablosundaki `label` sütununu yansıtır.
  'docsync.providerUrl': 'Adres',
  'docsync.providerApiToken': 'API belirteci',
  'docsync.providerApiKey': 'API anahtarı',
  'docsync.providerAppPassword': 'Uygulama parolası',
  'docsync.providerAppToken': 'Uygulama belirteci',
  'docsync.providerUsername': 'Kullanıcı adı',
  'docsync.providerPassword': 'Parola',
  'docsync.providerOrganization': 'Kuruluş kimliği',
  'docsync.providerBasePath': 'Temel klasör',
  'docsync.providerOTP': 'İki adımlı doğrulama kodu',
  'docsync.allowInsecureTls': 'Kendinden imzalı sertifikayı kabul et',

  'docsync.hintPaperlessToken': 'Paperless’ta Profilim altında oluşturun. O hesabın bütün yetkilerini taşır.',
  'docsync.hintPapraKey':
    'Papra’da API anahtarları altında oluşturun. Papra anahtarları her zaman üyesi olduğunuz bütün kuruluşlara erişir.',
  'docsync.hintPapraOrg': 'Papra adres çubuğundaki org_… kimliği.',
  'docsync.hintNextcloudLogin': 'Nextcloud oturum açma adınız, e-posta adresiniz değil.',
  'docsync.hintNextcloudAppPassword': 'Ayarlar, Güvenlik, Yeni uygulama parolası oluştur. Asla hesap parolanız değil.',
  'docsync.hintOpenCloudToken': 'OpenCloud’da uygulama belirteçleri altında oluşturulur.',
  'docsync.hintBasePath': 'TREK’in gezi klasörlerini aradığı yer. Varsayılan /TREK.',
  'docsync.hintSynologyUrl': 'Bağlantı noktasını da yazın, örneğin https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'En iyisi, yalnızca bu paylaşılan klasöre erişimi olan ayrı bir DSM hesabı.',
  'docsync.hintSynologyOtp': 'Yalnızca hesapta iki adımlı doğrulama açıksa ve bir kez gerekir.',

  'docsync.linkState.never': 'Henüz eşitlenmedi',
  'docsync.linkState.ok': 'Eşit durumda',
  'docsync.linkState.partial': 'Kısmen eşitlendi',
  'docsync.linkState.failed': 'Başarısız',
  'docsync.linkState.needs_reauth': 'Yeniden oturum açın',
  'docsync.linkState.scope_lost': 'Klasör kayboldu',
  'docsync.linkState.orphaned': 'Sahibi geziden ayrıldı',

  'docsync.state.pending': 'Bekliyor',
  'docsync.state.synced': 'Eşitlendi',
  'docsync.state.conflict': 'Çakışma',
  'docsync.state.rejected_type': 'Türe izin verilmiyor',
  'docsync.state.too_large': 'Çok büyük',
  'docsync.state.error': 'Hata',
  'docsync.state.remote_missing': 'Sağlayıcıda yok',
  'docsync.state.local_deleted': 'TREK’te silindi',
  'docsync.state.scope_drift': 'Klasörün dışına taşındı',

  'docsync.conflict.resolve': "{count} tanesini çöz",

  'docsync.conflict.title': 'İki kopya da değişti',
  'docsync.conflict.keepTrek': 'TREK sürümünü tut',
  'docsync.conflict.keepProvider': 'Sağlayıcıdaki sürümü tut',
  'docsync.conflict.keepBoth': 'İkisini de tut',

  // Hata nedenleri her zaman kod olarak taşınır, karşı taraftan gelen metin olarak değil:
  // bir sağlayıcı İngilizce yanıt verir ya da bir vekil sunucunun HTML oturum sayfasını
  // döndürür; ikisinin de burada yeri yok.
  'docsync.error.unreachable': 'Sağlayıcıya ulaşılamadı.',
  'docsync.error.tls_untrusted':
    'Sertifika reddedildi. Bu kuruluma güveniyorsanız kendinden imzalı sertifikalara izin verin.',
  'docsync.error.unauthorized': 'Kimlik bilgileri reddedildi.',
  'docsync.error.forbidden': 'Bu hesabın bunu yapma izni yok.',
  'docsync.error.not_found': 'Sağlayıcıda bulunamadı.',
  'docsync.error.scope_missing': 'Bağlanan klasör artık yok.',
  'docsync.error.rate_limited': 'Sağlayıcı istek hızımızı sınırlıyor. TREK daha sonra yeniden deneyecek.',
  'docsync.error.too_large': 'Dosya, sağlayıcının kabul ettiğinden büyük.',
  'docsync.error.unsupported_type': 'Sağlayıcı bu dosya türünü kabul etmiyor.',
  'docsync.error.quota_exceeded': 'Sağlayıcının yeri kalmadı.',
  'docsync.error.conflict': 'Belge iki tarafta da değişti.',
  'docsync.error.checksum_mismatch': 'Aktarım eksiksiz ulaşmadı.',
  'docsync.error.provider_error': 'Sağlayıcı bir hata bildirdi.',
  'docsync.error.timeout': 'Sağlayıcı yanıt vermekte çok gecikti.',
  'docsync.error.ssrf_blocked': 'Bu adrese izin verilmiyor.',
  'docsync.error.mass_delete_guard':
    'Belgelerin çoğu bir anda kayboldu, bu yüzden hiçbir şey değiştirilmedi. Klasörün hâlâ bağlı olduğunu denetleyin.',
  'docsync.error.unknown': 'Bir şeyler ters gitti.',

  // ── İletişim kutusu ────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Bu gezi',
  'docsync.addAnother': 'Başka ekle',
  'docsync.syncing': 'Eşitleniyor',
  'docsync.card.pickFolder': 'Bağlandı, bir klasör seçin',

  'docsync.empty.title': 'Henüz bir şey bağlanmadı',
  'docsync.empty.hintOwner':
    'Soldan bir depo seçin. TREK her şeyin kendi kopyasını tutar, depo ortadan kalksa da hiçbir şey kaybolmaz.',
  'docsync.empty.hintMember': 'Bunu gezi sahibi ayarlar. Belgeler her durumda TREK’te kalır.',

  // Her ürünün dosyalama biçimi. Kimse bağlanmadan önce gösterilir, çünkü bir
  // sonraki ekranın soracağı şey budur.
  'docsync.model.paperless': 'Etiketlerle düzenler',
  'docsync.model.papra': 'Bir kuruluş içinde etiketlerle düzenler',
  'docsync.model.nextcloud': 'Bir klasörde tutar',
  'docsync.model.opencloud': 'Bir alanda tutar',
  'docsync.model.synologydrive': 'NAS’taki bir klasörde tutar',

  // ── Akış çubuğu ────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Depoya giden',
  'docsync.flow.toTrek': 'Depodan gelen',
  'docsync.flow.documents': 'belge',
  'docsync.flow.summary.both': 'Belgeler iki yönde de taşınır.',
  'docsync.flow.summary.pull': 'Belgeler yalnızca içeri gelir.',
  'docsync.flow.summary.push': 'Belgeler yalnızca dışarı gider.',
  'docsync.flow.summaryEditable.both': 'İki yönde de taşınıyor. Durdurmak için bir şeride dokunun.',
  'docsync.flow.summaryEditable.pull': 'Yalnızca içeri geliyor. Dışarı da göndermek için diğer şeride dokunun.',
  'docsync.flow.summaryEditable.push': 'Yalnızca dışarı gidiyor. İçeri de almak için diğer şeride dokunun.',

  // ── Tek bir bağ ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Ayarlar',
  'docsync.binding.folder': 'Klasör',
  'docsync.binding.lastRun': 'Son çalışma',
  'docsync.binding.autoOff': 'Duraklatıldı',
  'docsync.binding.neverRun': 'henüz çalışmadı',
  'docsync.binding.deleteHint': 'Karşı taraftaki kopyaya ne olacağı.',
  'docsync.binding.conflictHint': 'Belge iki yerde de düzenlendiğinde hangi kopyanın kalacağı.',
  'docsync.binding.autoHint': 'Değişiklikleri arka planda denetler.',
  'docsync.binding.webhookTitle': 'Anında güncelleme',
  'docsync.binding.copy': 'Kopyala',
  'docsync.binding.copied': 'Kopyalandı',

  // ── Bağlanma ───────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Bağlan',
  'docsync.connect.testing': 'Ulaşılmaya çalışılıyor',
  'docsync.connect.okAs': 'Ulaşıldı, {account} olarak oturum açıldı',
  'docsync.connect.insecureHint': 'Kendi ağınızdaki, kendinden imzalı sertifikası olan kurulumlar için.',
  'docsync.connect.about.paperless':
    'TREK bu geziyi kendi etiketi altında tutar, arşivinizin geri kalanına hiç dokunmaz.',
  'docsync.connect.about.papra':
    'Bu gezinin ait olduğu kuruluşu seçin. TREK geziyi onun içinde kendi etiketi altında tutar.',
  'docsync.connect.about.nextcloud':
    'Hesap parolanızı değil, bir uygulama parolası kullanın: iki adımlı doğrulamayla çalışır ve tek başına iptal edilebilir.',
  'docsync.connect.about.opencloud': 'TREK bu gezi için her şeyden ayrı, kendi alanını alır.',
  'docsync.connect.about.synologydrive':
    'En iyisi, yalnızca bu gezinin kullanacağı paylaşılan klasöre erişen bir DSM hesabı.',

  // ── Kapsayıcıyı seçme ──────────────────────────────────────────────────────
  'docsync.scope.title': 'Bu gezi {provider} içinde nerede dursun?',
  'docsync.scope.intro': 'Yalnızca buradakiler eşitlenir. Deponuzdaki diğer her şey TREK’in dışında kalır.',
  'docsync.scope.createTitle': 'Yeni bir tane oluştur',
  'docsync.scope.createAction': 'Oluştur',
  'docsync.scope.pickTitle': 'Ya da var olanlardan birini kullanın',
  'docsync.scope.search': 'Ara',
  'docsync.scope.noMatch': 'Eşleşen bir şey yok.',

  // ── Kişinin karar vermesi gerekenler ───────────────────────────────────────
  'docsync.issues.title': 'Bakılması gerekenler',
  'docsync.issues.conflict': 'İki yerde de değişti. Hangisinin kalacağını seçin.',
  'docsync.issues.remote_missing': 'Depoda yok. TREK’teki kopya duruyor.',
  'docsync.issues.rejected_type': 'Bu dosya türüne burada izin verilmiyor.',
  'docsync.issues.too_large': 'Sınırdan büyük.',
  'docsync.issues.error': 'Aktarım tamamlanamadı.',

  'docsync.error.unknown_provider': 'Bu sağlayıcı bu kurulumda kullanılamıyor.',
  'docsync.error.provider_disabled': 'Duraklatıldı: bir yönetici bu sağlayıcıyı kapattı. Yeniden açıldığında eşitleme kaldığı yerden devam eder.',
  'docsync.binding.reconnect': 'Yeniden bağlan',
};

export default docsync;
