// FE-MOB-SET-ABOUT-001
import { describe, expect, it } from 'vitest';
import MSettingsAbout from '../../../../src/mobile/screens/settings/MSettingsAbout';
import { render, screen } from '../../../helpers/render';

describe('MSettingsAbout', () => {
  it('FE-MOB-SET-ABOUT-001: points the bug, feature request and wiki links at the liketrek/TREK repository', () => {
    render(<MSettingsAbout appVersion="1.0.0" />);

    expect(screen.getByText('Report a Bug').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/liketrek/TREK/issues/new?template=bug_report.yml'
    );
    expect(screen.getByText('Feature Request').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/liketrek/TREK/discussions/new?category=feature-requests'
    );
    expect(screen.getByText('Wiki').closest('a')).toHaveAttribute('href', 'https://github.com/liketrek/TREK/wiki');
  });
});
