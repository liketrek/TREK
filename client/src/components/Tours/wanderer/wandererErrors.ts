type Translate = (key: string, params?: Record<string, unknown>) => string;

/** A wanderer reason code as a sentence in the reader's language; an unknown code still gets one. */
export function wandererErrorText(t: Translate, code: string): string {
  const text = t(`wanderer.error.${code}`);
  return text === `wanderer.error.${code}` ? t('wanderer.error.unknown') : text;
}
