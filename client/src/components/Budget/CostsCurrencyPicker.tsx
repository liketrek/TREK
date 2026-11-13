import { useTranslation } from '../../i18n';
import CustomSelect from '../shared/CustomSelect';
import { Tooltip } from '../shared/Tooltip';

/**
 * Which currency Costs shows the trip in (#1683): a compact select with the
 * usual currency and the trip's own on top. Desktop bar, narrow window and phone
 * tab alike; the pick itself lives in useCostsCurrency.
 */
export function CostsCurrencyPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (currency: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Tooltip label={t('costs.showIn')}>
      <div className="w-[92px] flex-none">
        <CustomSelect
          ariaLabel={t('costs.showIn')}
          value={value}
          onChange={(v) => onChange(String(v))}
          options={options}
          size="sm"
          searchable
          menuFit="content"
          style={{ width: '100%' }}
        />
      </div>
    </Tooltip>
  );
}
