import { render, screen } from '../../../tests/helpers/render';
import { FlowPills } from './FlowPills';

const Avatar = ({ id }: { id: number; size?: number }) => <span data-testid={`avatar-${id}`} />;
const names: Record<number, string> = { 1: 'alice', 2: 'bob' };

describe('FlowPills', () => {
  it('shows the lead and one pill per person, even when a person turns up in two flows', () => {
    render(<FlowPills ids={[2, 1, 2]} lead="to" Avatar={Avatar} name={(id) => names[id]} />);

    expect(screen.getByText('to')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^avatar-/)).toHaveLength(2);
  });
});
