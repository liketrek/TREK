/**
 * The 429 message the axios interceptor shows instead of the server's English
 * text. It reads the language straight from storage because the interceptor runs
 * outside React and cannot reach the translation context.
 */
const RATE_LIMIT_MESSAGES: Record<string, string> = {
  en: 'Too many attempts. Please try again later.',
  de: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
  es: 'Demasiados intentos. Inténtelo de nuevo más tarde.',
  et: 'Liiga palju katseid. Palun proovi hiljem uuesti.',
  fr: 'Trop de tentatives. Veuillez réessayer plus tard.',
  hu: 'Túl sok próbálkozás. Kérjük, próbálja újra később.',
  nl: 'Te veel pogingen. Probeer het later opnieuw.',
  br: 'Muitas tentativas. Tente novamente mais tarde.',
  cs: 'Příliš mnoho pokusů. Zkuste to prosím znovu.',
  sk: 'Príliš veľa pokusov. Skúste to prosím neskôr.',
  pl: 'Zbyt wiele prób. Spróbuj ponownie później.',
  ru: 'Слишком много попыток. Попробуйте позже.',
  zh: '尝试次数过多，请稍后再试。',
  'zh-TW': '嘗試次數過多，請稍後再試。',
  it: 'Troppi tentativi. Riprova più tardi.',
  tr: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
  ar: 'محاولات كثيرة جدًا. يرجى المحاولة لاحقًا.',
  az: 'Həddindən çox cəhd edildi. Bir az sonra yenidən cəhd edin.',
  id: 'Terlalu banyak percobaan. Coba lagi nanti.',
  ja: '試行回数が多すぎます。時間をおいて再度お試しください。',
  ko: '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  th: 'พยายามหลายครั้งเกินไป โปรดลองอีกครั้งภายหลัง',
  uk: 'Занадто багато спроб. Спробуйте пізніше.',
  sv: 'För många försök. Prova igen senare.',
  ca: 'Massa intents. Torneu-ho a provar més tard.',
  gr: 'Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά αργότερα.',
  vi: 'Quá nhiều lần thử. Vui lòng thử lại sau.',
};

export function translateRateLimit(): string {
  const fallback = RATE_LIMIT_MESSAGES['en']!;
  try {
    const lang = localStorage.getItem('app_language') || localStorage.getItem('app_language_server') || 'en';
    return RATE_LIMIT_MESSAGES[lang] ?? fallback;
  } catch {
    return fallback;
  }
}
