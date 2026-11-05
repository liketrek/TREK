import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'בדיקת שינויים בשבילים שלי',
  'wanderer.watch.hint': 'התראה כשייתכן שחל שינוי בשביל שיובא.',
  'wanderer.watch.info':
    'לכל היותר פעם ביום, TREK קורא את הרשומה המקוצרת של כל שביל שייבאתם, ואף פעם לא את קובץ ה-GPX שלו. הוא רק שולח לכם התראה: אתם מחליטים אם להחיל את השינוי, דרך בדיקת המקור של המסלול.',
  'wanderer.watch.notConnected': 'חברו קודם את wanderer',
  'wanderer.watch.on': 'הבדיקה ברקע הופעלה',
  'wanderer.watch.off': 'הבדיקה ברקע כובתה',
  'wanderer.watch.failed': 'לא ניתן היה לשנות את מצב הבדיקה ברקע',
  'wanderer.watch.lastRun': 'בדיקה אחרונה: {date}',
  'wanderer.watch.neverRun': 'טרם בוצעה בדיקה',
  'wanderer.watch.paused': 'מושהה עד {time}',
  'wanderer.watch.pausedHint': 'wanderer לא הגיב. אחרי כל ניסיון שנכשל, TREK ממתין זמן רב יותר לפני שהוא מנסה שוב.',
  'wanderer.watch.blocked': 'האסימון נדחה',
  'wanderer.watch.blockedHint':
    'wanderer דחה את אסימון ה-API. הבדיקה תתחדש אחרי שבדיקת חיבור תצליח או שאסימון חדש יישמר.',
  'wanderer.watch.hints': 'רמזים',
  'wanderer.watch.hintsCount': '{count} רמזים פתוחים',
  'wanderer.watch.hintsCount.one': 'רמז פתוח אחד',
  'wanderer.watch.hintsCount.two': '{count} רמזים פתוחים',
  'wanderer.watch.empty': 'אין רמזים פתוחים',
  'wanderer.watch.dialogTitle': 'רמזים לגבי השבילים שלכם',
  'wanderer.watch.openTour': 'פתחו את המסלול',
  'wanderer.watch.checkedAt': 'נבדק: {date}',
  'wanderer.watch.noticeLabel': 'בדיקה ברקע',
  'wanderer.watch.state.possible_change': 'ייתכן שהשתנה',
  'wanderer.watch.state.changed': 'השתנה',
  'wanderer.watch.state.unverifiable': 'לא ניתן לבדיקה',
  'wanderer.watch.stateHint.possible_change':
    'wanderer שינה את חותמת הזמן של השביל. רק בדיקת המקור תראה אם התוכן שלו השתנה.',
  'wanderer.watch.stateHint.changed': 'ברשומה של wanderer מופיעים שם או תיאור שונים. בדיקת המקור תראה את כל מה שהשתנה.',
  'wanderer.watch.stateHint.unverifiable': 'TREK לא הצליח לבדוק את השביל הזה, ולכן אין מידע על שינוי אפשרי בו.',
  'wanderer.watch.reason.unavailable': 'השביל אינו נגיש',
  'wanderer.watch.reason.no_change_time': 'אין חותמת זמן',
};

export default wandererWatch;
