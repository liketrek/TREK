// FE-ADMIN-PHOTOICONS-001 to FE-ADMIN-PHOTOICONS-002
import { describe, expect, it } from 'vitest';

import { render } from '../../../../tests/helpers/render';
import { ImmichIcon, SynologyIcon } from './PhotoProviderIcons';

const marks = [
  ['ImmichIcon', ImmichIcon],
  ['SynologyIcon', SynologyIcon],
] as const;

describe('PhotoProviderIcons', () => {
  it.each(marks)('FE-ADMIN-PHOTOICONS-001: %s draws a 14px currentColor glyph by default', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '14');
    expect(svg).toHaveAttribute('height', '14');
    expect(svg).toHaveStyle({ flexShrink: '0' });
    expect(container.querySelector('path')).toHaveAttribute('fill', 'currentColor');
  });

  it.each(marks)('FE-ADMIN-PHOTOICONS-002: %s takes its size from the caller', (_name, Icon) => {
    const { container } = render(<Icon size={22} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '22');
    expect(svg).toHaveAttribute('height', '22');
  });
});
