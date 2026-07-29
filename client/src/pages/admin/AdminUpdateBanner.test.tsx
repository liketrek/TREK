// FE-ADMBAN-001 to FE-ADMBAN-005
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useTranslation } from '../../i18n';
import type { UpdateInfo } from './adminModel';
import AdminUpdateBanner from './AdminUpdateBanner';

function Harness({ updateInfo, onHowTo }: { updateInfo: UpdateInfo; onHowTo: () => void }) {
  const { t } = useTranslation();
  return <AdminUpdateBanner updateInfo={updateInfo} t={t} onHowTo={onHowTo} />;
}

function buildUpdateInfo(overrides: Partial<UpdateInfo> = {}): UpdateInfo {
  return { update_available: true, latest: '3.5.0', current: '3.4.1', ...overrides };
}

describe('AdminUpdateBanner', () => {
  it('FE-ADMBAN-001: shows the available headline', () => {
    render(<Harness updateInfo={buildUpdateInfo()} onHowTo={() => {}} />);

    expect(screen.getByText('Update available')).toBeInTheDocument();
  });

  it('FE-ADMBAN-002: interpolates latest and current version into the text', () => {
    render(<Harness updateInfo={buildUpdateInfo()} onHowTo={() => {}} />);

    expect(screen.getByText('TREK v3.5.0 is available. You are running v3.4.1.')).toBeInTheDocument();
  });

  it('FE-ADMBAN-003: hides the GitHub link when release_url is missing', () => {
    render(<Harness updateInfo={buildUpdateInfo()} onHowTo={() => {}} />);

    expect(screen.queryByRole('link', { name: /view on github/i })).not.toBeInTheDocument();
  });

  it('FE-ADMBAN-004: links to the release when release_url is set', () => {
    render(
      <Harness
        updateInfo={buildUpdateInfo({ release_url: 'https://github.com/liketrek/TREK/releases/tag/v3.5.0' })}
        onHowTo={() => {}}
      />
    );

    const link = screen.getByRole('link', { name: /view on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/liketrek/TREK/releases/tag/v3.5.0');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('FE-ADMBAN-005: calls onHowTo when the how-to button is clicked', () => {
    const onHowTo = vi.fn();
    render(<Harness updateInfo={buildUpdateInfo()} onHowTo={onHowTo} />);

    fireEvent.click(screen.getByRole('button', { name: /how to update/i }));

    expect(onHowTo).toHaveBeenCalledTimes(1);
  });
});
