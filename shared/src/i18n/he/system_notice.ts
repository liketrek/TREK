import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'התמונות עברו מקום בגרסה 3.0',
  'system_notice.v3_photos.body':
    '**התמונות** הוסרו ממתכנן הטיולים. התמונות שלכם בטוחות — TREK מעולם לא שינה את ספריית ה-Immich או ה-Synology שלכם.\n\nהתמונות נמצאות עכשיו בתוסף **יומן מסע**. יומן מסע הוא אופציונלי — אם הוא עדיין לא זמין, בקשו ממנהל המערכת להפעיל אותו בניהול → תוספים.',
  'system_notice.v3_journey.title': 'הכירו את יומן המסע',
  'system_notice.v3_journey.body':
    'תעדו את הטיולים שלכם כסיפורי מסע עשירים עם צירי זמן, גלריות תמונות ומפות אינטראקטיביות.',
  'system_notice.v3_journey.cta_label': 'פתיחת יומן המסע',
  'system_notice.v3_journey.highlight_timeline': 'ציר זמן וגלריה יום אחר יום',
  'system_notice.v3_journey.highlight_photos': 'ייבוא מ-Immich או Synology',
  'system_notice.v3_journey.highlight_share': 'שיתוף ציבורי — בלי צורך בהתחברות',
  'system_notice.v3_journey.highlight_export': 'ייצוא כאלבום תמונות PDF',
  'system_notice.v3_features.title': 'עוד חידושים בגרסה 3.0',
  'system_notice.v3_features.body': 'עוד כמה דברים שכדאי לדעת על הגרסה הזו.',
  'system_notice.v3_features.highlight_dashboard': 'עיצוב מחדש של לוח הבקרה עם דגש על מובייל',
  'system_notice.v3_features.highlight_offline': 'מצב לא מקוון מלא כ-PWA',
  'system_notice.v3_features.highlight_search': 'השלמה אוטומטית בזמן אמת בחיפוש מקומות',
  'system_notice.v3_features.highlight_import': 'ייבוא מקומות מקובצי KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: שדרוג ל-OAuth 2.1',
  'system_notice.v3_mcp.body':
    'שילוב ה-MCP עבר שיפוץ מלא. OAuth 2.1 הוא עכשיו שיטת האימות המומלצת. אסימונים סטטיים ישנים (trek_…) הוצאו משימוש ויוסרו בגרסה עתידית.',
  'system_notice.v3_mcp.highlight_oauth': 'מומלץ OAuth 2.1 ‏(mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 הרשאות מפורטות',
  'system_notice.v3_mcp.highlight_deprecated': 'אסימוני trek_ סטטיים הוצאו משימוש',
  'system_notice.v3_mcp.highlight_tools': 'ערכת כלים והנחיות מורחבת',
  'system_notice.v3_thankyou.title': 'מילה אישית ממני',
  'system_notice.v3_thankyou.body':
    'לפני שתמשיכו — אני רוצה לעצור לרגע.\n\nTREK התחיל כפרויקט צדדי שבניתי לטיולים שלי. לא דמיינתי שהוא יגדל למשהו ש-4,000 מכם סומכים עליו לתכנון ההרפתקאות שלכם. כל כוכב, כל באג, כל בקשת תכונה — אני קורא את כולם, והם מחזיקים אותי בלילות המאוחרים בין עבודה במשרה מלאה ללימודים באוניברסיטה.\n\nחשוב לי שתדעו: TREK תמיד יהיה קוד פתוח, תמיד באירוח עצמי, תמיד שלכם. בלי מעקב, בלי מנויים, בלי אותיות קטנות. רק כלי שנבנה על ידי מישהו שאוהב לטייל בדיוק כמוכם.\n\nתודה מיוחדת ל-[jubnl](https://github.com/jubnl) — הפכת לשותף מדהים. כל כך הרבה ממה שהופך את 3.0 לטובה נושא את טביעות האצבע שלך. תודה שהאמנת בפרויקט כשהוא עוד היה מחוספס.\n\nולכל אחד ואחת מכם שדיווח על באג, תרגם מחרוזת, שיתף את TREK עם חבר, או פשוט השתמש בו לתכנון טיול — **תודה**. בזכותכם זה קיים.\n\nלעוד הרבה הרפתקאות משותפות.\n\n— Maurice\n\n---\n\n[הצטרפו לקהילה ב-Discord](https://discord.gg/7Q6M6jDwzf)\n\nאם TREK משפר לכם את הטיולים, [קפה קטן](https://ko-fi.com/mauriceboe) תמיד עוזר להשאיר את האורות דולקים.',
  'system_notice.v3014_whitespace_collision.title': 'נדרשת פעולה: התנגשות בחשבונות משתמשים',
  'system_notice.v3014_whitespace_collision.body':
    'השדרוג לגרסה 3.0.14 זיהה התנגשות אחת או יותר בשמות משתמש או באימיילים שנגרמו מרווחים בתחילת/סוף חשבונות שמורים. החשבונות המושפעים קיבלו שם חדש אוטומטית. בדקו ביומני השרת שורות שמתחילות ב-**[migration] WHITESPACE COLLISION** כדי לזהות אילו חשבונות דורשים בדיקה.',
  'system_notice.welcome_v1.title': 'ברוכים הבאים ל-TREK',
  'system_notice.welcome_v1.body':
    'מתכנן הטיולים הכל-באחד שלכם. בנו מסלולים, שתפו טיולים עם חברים ושמרו על סדר — אונליין או אופליין.',
  'system_notice.welcome_v1.cta_label': 'תכננו טיול',
  'system_notice.welcome_v1.hero_alt': 'יעד טיול ציורי עם ממשק התכנון של TREK',
  'system_notice.welcome_v1.highlight_plan': 'מסלולים יום אחר יום לכל טיול',
  'system_notice.welcome_v1.highlight_share': 'שיתוף פעולה עם שותפים לטיול',
  'system_notice.welcome_v1.highlight_offline': 'עובד אופליין במובייל',
  'system_notice.dev_test_modal.title': '[Dev] הודעת בדיקה',
  'system_notice.dev_test_modal.body': 'זוהי הודעת בדיקה לסביבת פיתוח בלבד.',
  'system_notice.thank_you_support.title': 'תודה שאתם משתמשים ב-TREK',
  'system_notice.thank_you_support.body':
    'תודה קטנה על התקנת TREK — זה באמת משמעותי בשבילי.\n\nאני מפתח יחיד ובונה את TREK בזמני הפנוי. הוא התחיל ככלי קטן לטיולים שלי, ואני באמת המום מהתמיכה וההתעניינות של הקהילה מאז. TREK נבנה עם הרבה לב מצדי — וגם בזכות המון תורמים חיצוניים מדהימים שעזרו לעצב אותו.\n\n**TREK הוא קוד פתוח וחינמי לגמרי — וכך הוא יישאר לתמיד. בלי מסלולים בתשלום, בלי מנויים, בלי מלכודות. אני מבטיח.**\n\nאם TREK מועיל לכם ואתם רוצים לתמוך בפיתוח שלו, קפה קטן באמת עוזר לי להמשיך לבנות — בלי שום לחץ, אבל כל כוס מחזיקה את הלילות המאוחרים.\n\nתודה שאתם כאן.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% קוד פתוח ב-GitHub',
  'system_notice.thank_you_support.highlight_free': 'חינם לתמיד — בלי מסלולים בתשלום',
  'system_notice.thank_you_support.highlight_community': 'נבנה יחד עם הקהילה',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'תמיכה ב-Ko-fi',
  'system_notice.release_notes.eyebrow': 'העדכון הותקן',
  'system_notice.release_notes.headline': 'קודם כל, המקום הנכון.',
  'system_notice.release_notes.intro':
    'חיפוש מקומות, חיפוש כתובות וניתוב פועלים עכשיו על השרתים של TREK עצמו, בחסות dataforest cloud, וכל TREK יכול לשתף את מה שהוא יודע על מקומות עם כל השאר.',
  'system_notice.release_notes.features_label': 'החידושים המרכזיים',
  'system_notice.release_notes.features_aside': 'ולא רק',
  'system_notice.release_notes.feature_search_title': 'חיפוש מקומות שקולע',
  'system_notice.release_notes.feature_search_body':
    'ערים, איים, אתרים מפורסמים ושדות תעופה לפי הקוד שלהם מופיעים ראשונים, בתי קפה מגיעים מהסביבה שלכם, והצעות מופיעות תוך כדי הקלדה.',
  'system_notice.release_notes.feature_share_title': 'פרטי מקומות, משותפים',
  'system_notice.release_notes.feature_share_body':
    'שתפו אתרים, שעות פתיחה ותמונות עם כל TREK, שדה אחר שדה, והמקומות השמורים שלכם מקבלים את מה שאחרים הוסיפו.',
  'system_notice.release_notes.feature_routing_title': 'ניתוב מהיר יותר',
  'system_notice.release_notes.feature_routing_body':
    'יום שלם מנותב בבת אחת עם עד עשרים עצירות, מסלול איטי אחד כבר לא מעכב את השאר, ותחבורה ציבורית פונה לספק שני כשהראשון לא מוצא כלום.',
  'system_notice.release_notes.footnote': 'ועוד רשימה ארוכה של שינויים קטנים בכל שאר TREK.',
  'system_notice.release_notes.notes_label': 'הערות גרסה',
  'system_notice.release_notes.note_eyebrow': 'מילה מהמתחזק',
  'system_notice.release_notes.note_title': 'בזכותכם אני ממשיך לבנות את TREK.',
  'system_notice.release_notes.note_body':
    'TREK התחיל ככלי קטן לטיולים שלי, שנכתב אחרי העבודה כי רציתי דרך טובה יותר לתכנן אותם. הוא אף פעם לא באמת הפסיק לגדול. כמעט כל מה שאתם משתמשים בו נבנה בשעות הלילה המאוחרות, בסופי שבוע, ברכבות, לצד עבודה במשרה מלאה, והיו לא מעט ערבים שבהם תהיתי בשקט אם מישהו בכלל יפתח אותו.',
  'system_notice.release_notes.promise_label': 'ההבטחה',
  'system_notice.release_notes.promise_lead': 'TREK נשאר חינמי, לתמיד.',
  'system_notice.release_notes.promise_text': 'כל תכונה, כל עדכון, לכולם. בלי מסלולים בתשלום, בלי מנויים, בלי מלכודות.',
  'system_notice.release_notes.note_body_after':
    'ואז אתם הגעתם. תוך כמה חודשים הייתם אלפים: כוכבים, דיווחי באגים, תרגומים לשפות שאני לא מדבר, בקשות משיכה מאנשים שמעולם לא פגשתי. אני עדיין בודק את המאגר דבר ראשון כל בוקר, וזה עדיין לא לגמרי מרגיש אמיתי.',
  'system_notice.release_notes.note_closing': 'תודה שאתם כאן, מ-Maurice.',
  'system_notice.release_notes.support_label': 'נשארים עצמאיים',
  'system_notice.release_notes.support_lead': "בלי Google ושות'.",
  'system_notice.release_notes.support_text':
    'חיפוש מקומות, חיפוש כתובות וניתוב פועלים על השרתים של TREK עצמו, היום בחסות dataforest cloud. אני נלחם על זה כל יום, וכדי שזה יישאר כך אני צריך את התמיכה שלכם.',
  'system_notice.release_notes.cta_bmc': 'קנו לי קפה',
  'system_notice.release_notes.cta_kofi': 'תמיכה ב-Ko-fi',
  'system_notice.pager.prev': 'ההודעה הקודמת',
  'system_notice.pager.next': 'ההודעה הבאה',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'מעבר להודעה {n}',
  'system_notice.pager.position': 'הודעה {current} מתוך {total}',
};

export default system_notice;
