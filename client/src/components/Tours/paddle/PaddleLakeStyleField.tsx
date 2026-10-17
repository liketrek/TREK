import type { PaddleLakeStyle } from '@trek/shared';
import { useTranslation } from '../../../i18n';
import { LABEL, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';

const STYLES: readonly PaddleLakeStyle[] = ['direct', 'shore'];

/**
 * PAD-11: how the route crosses a lake. Straight over is the rule; along the
 * shore is for wind, when a capsize near the bank is a short swim. The wind
 * card suggests it on a windy day; here it is chosen.
 */
export function PaddleLakeStyleField({
  value,
  onChange,
}: {
  value: PaddleLakeStyle;
  onChange: (style: PaddleLakeStyle) => void;
}) {
  const { t } = useTranslation();
  return (
    <div data-testid="tour-planner-lake-style" className="min-w-0">
      <span className={LABEL}>{t('tours.paddle.lakeStyle')}</span>
      <Segmented<PaddleLakeStyle>
        value={value}
        onChange={onChange}
        label={t('tours.paddle.lakeStyle')}
        fill
        options={STYLES.map((style) => ({ value: style, label: t(`tours.paddle.lakeStyle.${style}`) }))}
      />
      <span className="mt-1 block text-content-faint" style={fs(11, 'body')}>
        {t(`tours.paddle.lakeStyle.${value}Hint`)}
      </span>
    </div>
  );
}
