import type { NotificationLocale } from '../externalNotifications/types';

const ar: NotificationLocale = {
  email: {
    footer: 'تلقيت هذا لأنك قمت بتفعيل الإشعارات في TREK.',
    manage: 'إدارة التفضيلات',
    madeWith: 'Made with',
    openTrek: 'فتح TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `دعوة إلى "${p.trip}"`,
      body: `${p.actor} دعا ${p.invitee || 'عضو'} إلى الرحلة "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `حجز جديد: ${p.booking}`,
      body: `${p.actor} أضاف حجز "${p.booking}" (${p.type}) إلى "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `تذكير: ${p.trip}`,
      body: `رحلتك "${p.trip}" تقترب!`,
    }),
    todo_due: (p) => ({
      title: `مهمة مستحقة: ${p.todo}`,
      body: `"${p.todo}" في "${p.trip}" مستحقة في ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'دعوة دمج الإجازة',
      body: `${p.actor} يدعوك لدمج خطط الإجازة. افتح TREK للقبول أو الرفض.`,
    }),
    collection_invite: (p) => ({
      title: 'دعوة إلى مجموعة',
      body: `${p.actor} يدعوك لمشاركة مجموعة. افتح TREK للقبول أو الرفض.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} صور مشتركة`,
      body: `${p.actor} شارك ${p.count} صورة في "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `رسالة جديدة في "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `قائمة التعبئة: ${p.category}`,
      body: `${p.actor} عيّنك في فئة "${p.category}" في "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'إصدار TREK جديد متاح',
      body: `TREK ${p.version} متاح الآن. تفضل بزيارة لوحة الإدارة للتحديث.`,
    }),
    synology_session_cleared: () => ({
      title: 'تمت إعادة تعيين جلسة Synology',
      body: 'تغيّر حسابك أو رابط Synology. تم تسجيل خروجك من Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'إعادة تعيين كلمة المرور',
    greeting: 'مرحبا',
    body: 'تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في TREK. انقر على الزر أدناه لتعيين كلمة مرور جديدة.',
    ctaIntro: 'إعادة تعيين كلمة المرور',
    expiry: 'تنتهي صلاحية هذا الرابط خلال 60 دقيقة.',
    ignore: 'إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة — لن تتغير كلمة المرور الخاصة بك.',
  },
};

export default ar;
