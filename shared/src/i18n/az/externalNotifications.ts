import type { NotificationLocale } from '../externalNotifications/types';
const az: NotificationLocale = {
  email: {
    footer: 'Bu məktubu TREK-də bildirişləriniz aktiv olduğu üçün aldınız.',
    manage: 'Seçimləri Tənzimləmələr bölməsində idarə edin',
    madeWith: 'Hazırlanıb:',
    openTrek: 'TREK-i aç',
  },
  events: {
    trip_invite: (p) => ({
      title: `Səyahət dəvəti: “${p.trip}”`,
      body: `${p.actor} ${p.invitee || 'bir üzvü'} “${p.trip}” səyahətinə dəvət etdi.`,
    }),
    booking_change: (p) => ({
      title: `Yeni rezervasiya: ${p.booking}`,
      body: `${p.actor} “${p.trip}” səyahətinə yeni ${p.type} rezervasiyası — “${p.booking}” əlavə etdi.`,
    }),
    trip_reminder: (p) => ({
      title: `Səyahət xatırlatması: ${p.trip}`,
      body: `“${p.trip}” səyahətiniz yaxınlaşır!`,
    }),
    todo_due: (p) => ({
      title: `Tapşırığın son tarixi: ${p.todo}`,
      body: `“${p.trip}” səyahətindəki “${p.todo}” tapşırığının son tarixi: ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay birləşdirmə dəvəti',
      body: `${p.actor} sizi tətil planlarını birləşdirməyə dəvət etdi. Qəbul və ya rədd etmək üçün TREK-i açın.`,
    }),
    vacay_share: (p) => ({
      title: 'Vacay təqvimi paylaşıldı',
      body: `${p.actor} tətil təqvimini sizinlə paylaşdı. Baxmaq üçün TREK-i açın.`,
    }),
    collection_invite: (p) => ({
      title: 'Kolleksiya dəvəti',
      body: `${p.actor} sizi kolleksiyanı paylaşmağa dəvət etdi. Qəbul və ya rədd etmək üçün TREK-i açın.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} foto paylaşıldı`,
      body: `${p.actor} “${p.trip}” səyahətində ${p.count} foto paylaşdı.`,
    }),
    collab_message: (p) => ({
      title: `“${p.trip}” səyahətində yeni mesaj`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Baqaj: ${p.category}`,
      body: `${p.actor} sizi “${p.trip}” səyahətində “${p.category}” baqaj kateqoriyasına təyin etdi.`,
    }),
    version_available: (p) => ({
      title: 'Yeni TREK versiyası əlçatandır',
      body: `TREK ${p.version} artıq əlçatandır. Yeniləmək üçün administrator panelinə keçin.`,
    }),
    replica_failure: (p) => ({
      title: 'Yaddaş replikası xətası',
      body:
        `“${p.backend}” replikasına yazmaq mümkün olmadı: ${p.key} üçün ${p.op} — ${p.error}.` +
        (p.suppressed !== '0'
          ? ` Son bildirişdən bəri ${p.suppressed} əlavə xəta gizlədilib.`
          : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Synology sessiyası təmizləndi',
      body: 'Synology hesabınız və ya URL-iniz dəyişib. Synology Photos sessiyanız bağlanıb.',
    }),
    plugin_notification: (p) => ({
      title: p.title ?? '',
      body: p.body ?? '',
    }),
  },
  passwordReset: {
    subject: 'Parolunuzu sıfırlayın',
    greeting: 'Salam',
    body: 'TREK hesabınızın parolunu sıfırlamaq üçün sorğu aldıq. Yeni parol təyin etmək üçün aşağıdakı düyməyə klikləyin.',
    ctaIntro: 'Parolu sıfırla',
    expiry: 'Bu linkin vaxtı 60 dəqiqədən sonra bitəcək.',
    ignore: 'Bu sorğunu siz göndərməmisinizsə, məktubu nəzərə almaya bilərsiniz — parolunuz dəyişməyəcək.',
  },
};
export default az;