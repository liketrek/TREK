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
  'mailAdmin.status.title': 'Status', // same-as-en
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
