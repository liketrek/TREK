import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Rezervasyon e-postası içe aktarma',
  'mailAdmin.hint': 'Yönlendirilen rezervasyon onayları doğru seyahatte rezervasyona dönüşür.',
  'mailAdmin.enabled': 'Rezervasyon e-postalarını içe aktar',
  'mailAdmin.enabledHint':
    'Bu kurulumdaki herkese bir yönlendirme adresi verir. Kapalıyken hiçbir adres e-posta kabul etmez.',
  'mailAdmin.transport.label': 'E-posta nasıl ulaşır',
  'mailAdmin.transport.off': 'Yalnızca yükleme',
  'mailAdmin.transport.imap': 'IMAP posta kutusu',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Posta kutusu gerekmez: kaydedilmiş bir e-posta ayarlarda .eml dosyası olarak yüklenir ve TREK onu aynı şekilde okur. Denemek için ideal.',
  'mailAdmin.transport.imapInfo':
    'TREK her iki dakikada bir posta kutusuna bakar ve yeni e-postaları alır. Kişisel değil, artı adreslerini kabul eden ayrı bir kutu kullan (trek+…@alan-adin): okunan e-postalar TREK/processed klasörüne taşınır.',
  'mailAdmin.transport.webhookInfo':
    "Cloudflare Email Worker gibi bir e-posta hizmeti her e-postayı doğrudan TREK'e iletir ve aşağıdaki anahtarla imzalar, böylece kimse dışarıdan e-posta sokamaz. Posta kutusu olmayan kurulumlar için.",
  'mailAdmin.aiDaily': 'Kişi başı günlük yapay zeka e-postası',
  'mailAdmin.aiDailyHint': 'Bunun üstünde yalnızca makine tarafından okunabilir rezervasyon verisi okunur.',
  'mailAdmin.template': 'Adres şablonu',
  'mailAdmin.templateHint': 'Yönlendirme adresi; her kişinin kodunun geleceği yerde {token} bulunur.',
  'mailAdmin.imap.host': 'Sunucu',
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Şifreleme',
  'mailAdmin.imap.user': 'Kullanıcı',
  'mailAdmin.imap.pass': 'Parola',
  'mailAdmin.imap.mailbox': 'Klasör',
  'mailAdmin.imap.mailboxHint': 'Okunan e-postalar TREK/processed klasörüne taşınır.',
  'mailAdmin.webhook.secret': 'İmza anahtarı',
  'mailAdmin.webhook.secretHint':
    'En az 32 karakter; gönderen her e-postayı bununla imzalar. Boş bırakılırsa webhook kapanır.',
  'mailAdmin.inboundUrl': 'Webhook adresi',
  'mailAdmin.inboundUrlHint': 'E-posta servisin her e-postayı ham ve imzalı olarak buraya gönderir.',
  'mailAdmin.copyUrl': 'Adresi kopyala',
  'mailAdmin.envHint': 'Ortam değişkenleri (MAIL_INGEST_*) bu alanlardan önce gelir.',
  'mailAdmin.loadError': 'E-posta içe aktarma ayarları yüklenemedi.',
  'mailAdmin.problem.secretShort': 'Anahtar en az 32 karakter olmalı.',
  'mailAdmin.problem.portInvalid': '1 ile 65535 arasında bir port gir.',
  'mailAdmin.problem.templateToken': 'Adreste her kişinin kodu için {token} bulunmalı.',
  'mailAdmin.problem.dailyInvalid': '0 ile 1000 arasında bir tam sayı gir.',
  'mailAdmin.status.lastRead': 'Son okuma {time}',
  'mailAdmin.status.never': 'hiç',
  'mailAdmin.status.mails': 'E-postalar, 24 sa',
  'mailAdmin.status.added': 'Kendiliğinden eklenen',
  'mailAdmin.status.waiting': 'Bekleyen',
  'mailAdmin.status.failed': 'Başarısız',
  'mailAdmin.test.run': 'Bağlantıyı test et',
  'mailAdmin.test.ok': 'Bağlandı',
  'mailAdmin.test.failed': 'Bağlantı yok',
};
export default mailAdmin;
