// FE-COSTS-CARD-001 to -002: the figure cards on top of the Costs panel
import { render, screen, within } from '../../../tests/helpers/render';
import SummaryCard from './CostsSummaryCard';

const card = (currency: string) => (
  <SummaryCard
    label="Total spend"
    sub="Everything the trip has cost"
    amount={1234.5}
    currency={currency}
    locale="en"
    icon={null}
    foot={<span>Two expenses</span>}
    tone="total"
  />
);

describe('CostsSummaryCard', () => {
  it('FE-COSTS-CARD-001: mutes the symbol and the decimals beside the whole amount', () => {
    render(card('USD'));
    const region = screen.getByRole('region', { name: 'Total spend' });
    expect(region).toHaveTextContent('$1,234.50');
    expect(within(region).getByText('$')).toHaveClass('font-medium');
    expect(within(region).getByText('234')).not.toHaveClass('font-medium');
    expect(within(region).getByText('Two expenses')).toBeInTheDocument();
  });

  it('FE-COSTS-CARD-002: falls back to the plain amount for a code Intl does not know', () => {
    render(card('EURO'));
    expect(screen.getByRole('region', { name: 'Total spend' })).toHaveTextContent('1,234.50 EURO');
  });
});
