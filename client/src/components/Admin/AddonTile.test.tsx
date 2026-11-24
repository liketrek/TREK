// FE-ADMIN-ADDONTILE-001
import { describe, expect, it } from 'vitest';
import { render } from '../../../tests/helpers/render';
import AddonTile from './AddonTile';

describe('AddonTile', () => {
  it('FE-ADMIN-ADDONTILE-001: sub-rows that render nothing draw no list and no line', () => {
    const off = false;
    const { container, rerender } = render(
      <AddonTile icon={null} name="Booking mails" enabled={false}>
        {off && <li>Set up</li>}
      </AddonTile>
    );
    expect(container.querySelector('ul')).toBeNull();
    rerender(
      <AddonTile icon={null} name="Booking mails" enabled>
        {null}
        <li>Set up</li>
      </AddonTile>
    );
    expect(container.querySelectorAll('ul > li')).toHaveLength(1);
  });
});
