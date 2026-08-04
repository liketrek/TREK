// FE-ADMSTAT-001 to FE-ADMSTAT-003
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import AdminStatCard from './AdminStatCard';

describe('AdminStatCard', () => {
  it('FE-ADMSTAT-001: renders label and value', () => {
    render(<AdminStatCard label="Users" value={42} icon={Users} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('FE-ADMSTAT-002: renders zero without animating away from it', () => {
    render(<AdminStatCard label="Files" value={0} icon={Users} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('FE-ADMSTAT-003: renders the passed icon component with the card icon classes', () => {
    const { container } = render(<AdminStatCard label="Trips" value={7} icon={Users} />);

    expect(container.querySelector('svg.w-5.h-5.text-content')).toBeInTheDocument();
  });
});
