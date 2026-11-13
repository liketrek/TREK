import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Rezervasiya məktublarının idxalı',
  'mailAdmin.hint': 'Yönləndirilən rezervasiya təsdiqləri düzgün səyahətdə rezervasiyaya çevrilir.',
  'mailAdmin.enabled': 'Rezervasiya məktublarını idxal et',
  'mailAdmin.enabledHint':
    'Bu quraşdırmadakı hər kəsə yönləndirmə ünvanı verir. Deaktiv olduqda heç bir ünvan məktub qəbul etmir.',
  'mailAdmin.transport.label': 'Məktub necə gəlir',
  'mailAdmin.transport.off': 'Yalnız yükləmə',
  'mailAdmin.transport.imap': 'IMAP poçt qutusu',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Poçt qutusu lazım deyil: yadda saxlanmış məktub ayarlarda .eml faylı kimi yüklənir və TREK onu eyni şəkildə oxuyur. Sınamaq üçün yaxşıdır.',
  'mailAdmin.transport.imapInfo':
    'TREK hər iki dəqiqədən bir poçt qutusuna baxır və yeni məktubları götürür. Şəxsi deyil, plus ünvanları qəbul edən ayrıca qutudan istifadə edin (trek+…@your-domain): oxunmuş məktublar TREK/processed qovluğuna keçir.',
  'mailAdmin.transport.webhookInfo':
    'Cloudflare Email Worker kimi poçt xidməti hər məktubu birbaşa TREK-ə ötürür və aşağıdakı açarla imzalayır, beləliklə heç kim kənar məktub yerləşdirə bilməz. Poçt qutusu olmayan qurulumlar üçün.',
  'mailAdmin.aiDaily': 'Adambaşı gündəlik süni intellekt məktubu',
  'mailAdmin.aiDailyHint': 'Bundan yuxarıda yalnız maşın tərəfindən oxuna bilən rezervasiya məlumatı oxunur.',
  'mailAdmin.template': 'Ünvan şablonu',
  'mailAdmin.templateHint': 'Yönləndirmə ünvanı; hər şəxsin kodu gələn yerdə {token} olur.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Şifrələmə',
  'mailAdmin.imap.user': 'İstifadəçi',
  'mailAdmin.imap.pass': 'Parol',
  'mailAdmin.imap.mailbox': 'Qovluq',
  'mailAdmin.imap.mailboxHint': 'Oxunan məktublar TREK/processed qovluğuna köçürülür.',
  'mailAdmin.webhook.secret': 'İmza açarı',
  'mailAdmin.webhook.secretHint':
    'Ən azı 32 simvol; göndərən hər məktubu bununla imzalayır. Boş buraxılsa webhook söndürülür.',
  'mailAdmin.inboundUrl': 'Webhook ünvanı',
  'mailAdmin.inboundUrlHint': 'Poçt xidmətin hər məktubu xam və imzalı şəkildə bura göndərir.',
  'mailAdmin.copyUrl': 'Ünvanı kopyala',
  'mailAdmin.envHint': 'Mühit dəyişənləri (MAIL_INGEST_*) bu sahələrdən üstündür.',
  'mailAdmin.loadError': 'Məktub idxalı ayarları yüklənmədi.',
  'mailAdmin.problem.secretShort': 'Açar ən azı 32 simvol olmalıdır.',
  'mailAdmin.problem.portInvalid': '1 ilə 65535 arasında port daxil et.',
  'mailAdmin.problem.templateToken': 'Ünvanda hər şəxsin kodu üçün {token} olmalıdır.',
  'mailAdmin.problem.dailyInvalid': '0 ilə 1000 arasında tam ədəd daxil et.',
  'mailAdmin.status.lastRead': 'Son oxuma {time}',
  'mailAdmin.status.never': 'heç vaxt',
  'mailAdmin.status.mails': 'Məktublar, 24 saat',
  'mailAdmin.status.added': 'Özbaşına əlavə edilən',
  'mailAdmin.status.waiting': 'Gözləyən',
  'mailAdmin.status.failed': 'Uğursuz',
  'mailAdmin.test.run': 'Bağlantını yoxla',
  'mailAdmin.test.ok': 'Qoşuldu',
  'mailAdmin.test.failed': 'Bağlantı yoxdur',
};
export default mailAdmin;
