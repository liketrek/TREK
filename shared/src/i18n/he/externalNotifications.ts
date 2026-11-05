import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const he: NotificationLocale = {
  email: {
    footer: 'קיבלתם הודעה זו כי הפעלתם התראות ב-TREK.',
    manage: 'ניהול העדפות בהגדרות',
    madeWith: 'נוצר עם',
    openTrek: 'פתיחת TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `הזמנה לטיול: "${p.trip}"`,
      body: `${p.actor} הזמין/ה את ${p.invitee || 'חבר/ה'} לטיול "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `הזמנה חדשה: ${p.booking}`,
      body: `${p.actor} הוסיף/ה ${p.type} חדש/ה "${p.booking}" אל "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `תזכורת לטיול: ${p.trip}`,
      body: `הטיול "${p.trip}" מתקרב!`,
    }),
    todo_due: (p) => ({
      title: `משימה לביצוע: ${p.todo}`,
      body: `"${p.todo}" ב-"${p.trip}" צריכה להתבצע עד ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'הזמנה לאיחוד חופשות',
      body: `${p.actor} הזמין/ה אתכם לאחד תוכניות חופשה. פתחו את TREK כדי לאשר או לדחות.`,
    }),
    vacay_share: (p) => ({
      title: 'לוח חופשות שותף',
      body: `${p.actor} שיתף/ה איתכם את לוח החופשות. פתחו את TREK כדי לצפות בו.`,
    }),
    collection_invite: (p) => ({
      title: 'הזמנה לאוסף',
      body: `${p.actor} הזמין/ה אתכם לשתף אוסף. פתחו את TREK כדי לאשר או לדחות.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'he', {
        one: 'תמונה אחת שותפה',
        two: 'שתי תמונות שותפו',
        other: `${p.count} תמונות שותפו`,
      }),
      body: pluralForm(p.count, 'he', {
        one: `${p.actor} שיתף/ה תמונה אחת ב-"${p.trip}".`,
        two: `${p.actor} שיתף/ה שתי תמונות ב-"${p.trip}".`,
        other: `${p.actor} שיתף/ה ${p.count} תמונות ב-"${p.trip}".`,
      }),
    }),
    collab_message: (p) => ({
      title: `הודעה חדשה ב-"${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `אריזה: ${p.category}`,
      body: `${p.actor} שייך/ה אתכם לקטגוריית האריזה "${p.category}" ב-"${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'גרסה חדשה של TREK זמינה',
      body: `TREK ${p.version} זמין עכשיו. היכנסו ללוח הניהול כדי לעדכן.`,
    }),
    replica_failure: (p) => ({
      title: 'כשל בעותק אחסון',
      body:
        `כתיבה לעותק נכשלה ב-'${p.backend}': ${p.op} של ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'he', {
              one: ' כשל נוסף אחד הוסתר מאז ההתראה האחרונה.',
              two: ' שני כשלים נוספים הוסתרו מאז ההתראה האחרונה.',
              other: ` ${p.suppressed} כשלים נוספים הוסתרו מאז ההתראה האחרונה.`,
            })
          : ''),
    }),
    paddle_region_requested: (p) => ({
      title: 'התבקש אזור חתירה',
      body: `${p.actor} מתכנן/ת טיול חתירה ב-${p.region}. טענו או דחו את נתוני המים שלו באזור הניהול, תחת תוספים.`,
    }),
    synology_session_cleared: () => ({
      title: 'הפעלת Synology נוקתה',
      body: 'חשבון ה-Synology או הכתובת שלכם השתנו. התנתקתם מ-Synology Photos.',
    }),
    wanderer_source_hint: (p) => ({
      title: `מסלול wanderer: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `"${p.tour}" ב-"${p.trip}" השתנה ב-wanderer. פתחו את המסלול ובדקו את המקור שלו כדי לראות כל מה שהשתנה. שום דבר בטיול לא משתנה מעצמו.`
          : p.state === 'unverifiable'
            ? `כבר אי אפשר לבדוק את "${p.tour}" ב-"${p.trip}" ב-wanderer. המסלול בטיול שלכם נשאר כמו שהוא.`
            : `ייתכן ש-"${p.tour}" ב-"${p.trip}" השתנה ב-wanderer. פתחו את המסלול ובדקו את המקור שלו כדי לראות אם כן. שום דבר בטיול לא משתנה מעצמו.`,
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'איפוס הסיסמה שלכם',
    greeting: 'שלום',
    body: 'קיבלנו בקשה לאפס את הסיסמה של חשבון ה-TREK שלכם. לחצו על הכפתור למטה כדי להגדיר סיסמה חדשה.',
    ctaIntro: 'איפוס סיסמה',
    expiry: 'הקישור יפוג בעוד 60 דקות.',
    ignore: 'אם לא ביקשתם זאת, אפשר להתעלם מהאימייל — הסיסמה שלכם לא תשתנה.',
  },
};

export default he;
