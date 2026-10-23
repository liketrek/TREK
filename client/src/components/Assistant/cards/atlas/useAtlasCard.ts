import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { countryNamer } from '../../../../utils/countryName';
import { useAssistantView } from '../../assistantViewContext';
import { densityLimits } from './atlasCardModel';

/**
 * What every atlas card reads from where it is drawn: country names in the
 * reader's language, the locale for dates and numbers, and how many flags and
 * wish tiles fit. The phone always draws the compact card, a narrow window too.
 */
export function useAtlasCard() {
  const { language, locale } = useTranslation();
  const { variant, density } = useAssistantView();
  const roomy = variant !== 'fullscreen' && density === 'roomy';
  const countryName = useMemo(() => countryNamer(language), [language]);
  return { countryName, locale, roomy, limits: densityLimits(roomy) };
}
