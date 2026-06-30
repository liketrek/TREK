import type { NotificationLocale } from '../externalNotifications/types';

const tr: NotificationLocale = {
  email: {
    footer: "TREK'te bildirimleri etkinleştirdiğiniz için bunu aldınız.",
    manage: 'Ayarlarda tercihleri yönetin',
    madeWith: 'Made with',
    openTrek: "TREK'i aç",
  },
  events: {
    trip_invite: (p) => ({
      title: `"${p.trip}" seyahatine davet`,
      body: `${p.actor}, ${p.invitee || 'bir üyeyi'} "${p.trip}" seyahatine davet etti.`,
    }),
    booking_change: (p) => ({
      title: `Yeni rezervasyon: ${p.booking}`,
      body: `${p.actor}, "${p.trip}" seyahatine "${p.booking}" (${p.type}) rezervasyonu ekledi.`,
    }),
    trip_reminder: (p) => ({
      title: `Seyahat hatırlatıcısı: ${p.trip}`,
      body: `"${p.trip}" seyahatiniz yaklaşıyor!`,
    }),
    todo_due: (p) => ({
      title: `Görev süresi dolmak üzere: ${p.todo}`,
      body: `"${p.trip}" içindeki "${p.todo}" görevi ${p.due} tarihinde bitiyor.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay Fusion Daveti',
      body: `${p.actor} sizi tatil planlarını birleştirmeye davet etti. Kabul etmek veya reddetmek için TREK'i açın.`,
    }),
    collection_invite: (p) => ({
      title: 'Koleksiyon daveti',
      body: `${p.actor} sizi bir koleksiyonu paylaşmaya davet etti. Kabul etmek veya reddetmek için TREK’i açın.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} fotoğraf paylaşıldı`,
      body: `${p.actor}, "${p.trip}" içinde ${p.count} fotoğraf paylaştı.`,
    }),
    collab_message: (p) => ({
      title: `"${p.trip}" içinde yeni mesaj`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Bagaj: ${p.category}`,
      body: `${p.actor}, sizi "${p.trip}" içindeki "${p.category}" bagaj kategorisine atadı.`,
    }),
    version_available: (p) => ({
      title: 'Yeni TREK sürümü mevcut',
      body: `TREK ${p.version} artık mevcut. Güncellemek için yönetici panelini ziyaret edin.`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology oturumu temizlendi',
      body: 'Synology hesabınız veya URL değişti. Synology Photos oturumunuz kapatıldı.',
    }),
  },
  passwordReset: {
    subject: 'Şifrenizi sıfırlayın',
    greeting: 'Merhaba',
    body: 'TREK hesabınızın şifresini sıfırlamak için bir istek aldık. Yeni bir şifre belirlemek için aşağıdaki butona tıklayın.',
    ctaIntro: 'Şifreyi sıfırla',
    expiry: 'Bu bağlantı 60 dakika içinde sona erer.',
    ignore: 'Bu isteği siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz — şifreniz değişmeyecektir.',
  },
};

export default tr;
