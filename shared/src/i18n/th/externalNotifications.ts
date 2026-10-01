import type { NotificationLocale } from '../externalNotifications/types';

const th: NotificationLocale = {
  email: {
    footer: 'คุณได้รับข้อความนี้เนื่องจากเปิดใช้การแจ้งเตือนใน TREK',
    manage: 'จัดการการตั้งค่าในหน้าการตั้งค่า',
    madeWith: 'สร้างด้วย',
    openTrek: 'เปิด TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `คำเชิญเข้าร่วมทริป: "${p.trip}"`,
      body: `${p.actor} เชิญ ${p.invitee || 'สมาชิก'} ให้เข้าร่วมทริป "${p.trip}"`,
    }),
    booking_change: (p) => ({
      title: `การจองใหม่: ${p.booking}`,
      body: `${p.actor} เพิ่ม${p.type}ใหม่ "${p.booking}" ลงใน "${p.trip}"`,
    }),
    trip_reminder: (p) => ({
      title: `แจ้งเตือนทริป: ${p.trip}`,
      body: `ทริป "${p.trip}" ของคุณกำลังจะมาถึงเร็ว ๆ นี้!`,
    }),
    todo_due: (p) => ({
      title: `งานที่ถึงกำหนด: ${p.todo}`,
      body: `"${p.todo}" ใน "${p.trip}" ครบกำหนดวันที่ ${p.due}`,
    }),
    vacay_invite: (p) => ({
      title: 'คำเชิญรวมปฏิทินวันลา',
      body: `${p.actor} เชิญคุณให้รวมแผนวันลา เปิด TREK เพื่อยอมรับหรือปฏิเสธ`,
    }),
    vacay_share: (p) => ({
      title: 'แชร์ปฏิทินวันลาแล้ว',
      body: `${p.actor} แชร์ปฏิทินวันลาของตนกับคุณ เปิด TREK เพื่อดู`,
    }),
    collection_invite: (p) => ({
      title: 'คำเชิญให้แชร์คอลเลกชัน',
      body: `${p.actor} เชิญคุณให้แชร์คอลเลกชัน เปิด TREK เพื่อยอมรับหรือปฏิเสธ`,
    }),
    photos_shared: (p) => ({
      title: `แชร์รูปภาพ ${p.count} รูปแล้ว`,
      body: `${p.actor} แชร์รูปภาพ ${p.count} รูปใน "${p.trip}"`,
    }),
    collab_message: (p) => ({
      title: `ข้อความใหม่ใน "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `รายการจัดกระเป๋า: ${p.category}`,
      body: `${p.actor} มอบหมายหมวดหมู่รายการจัดกระเป๋า "${p.category}" ให้คุณใน "${p.trip}"`,
    }),
    version_available: (p) => ({
      title: 'มี TREK เวอร์ชันใหม่',
      body: `TREK ${p.version} พร้อมใช้งานแล้ว ไปที่แผงผู้ดูแลระบบเพื่ออัปเดต`,
    }),
    replica_failure: (p) => ({
      title: 'การจำลองที่เก็บข้อมูลล้มเหลว',
      body:
        `การเขียนไปยังแบบจำลอง '${p.backend}' ล้มเหลว: ${p.op} ของ ${p.key} — ${p.error}.` +
        (p.suppressed !== '0' ? ` มีการระงับข้อผิดพลาดเพิ่มเติม ${p.suppressed} รายการตั้งแต่การแจ้งเตือนครั้งก่อน` : ''),
    }),
    synology_session_cleared: () => ({
      title: 'ล้างเซสชัน Synology แล้ว',
      body: 'บัญชีหรือ URL ของ Synology เปลี่ยนแปลง คุณจึงออกจากระบบ Synology Photos แล้ว',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'รีเซ็ตรหัสผ่านของคุณ',
    greeting: 'สวัสดี',
    body: 'เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี TREK ของคุณ คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่',
    ctaIntro: 'รีเซ็ตรหัสผ่าน',
    expiry: 'ลิงก์นี้จะหมดอายุใน 60 นาที',
    ignore: 'หากคุณไม่ได้ส่งคำขอนี้ คุณสามารถละเว้นอีเมลนี้ได้อย่างปลอดภัย — รหัสผ่านของคุณจะไม่เปลี่ยนแปลง',
  },
};

export default th;
