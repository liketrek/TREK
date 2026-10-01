import { describe, it, expect } from 'vitest';
import { prepareLlmAddonConfigForWrite } from '../../../../src/nest/llm-parse/llm-config';

describe('prepareLlmAddonConfigForWrite: the vision setting', () => {
  it('stores a known mode as sent', () => {
    for (const vision of ['auto', 'on', 'off']) {
      expect(prepareLlmAddonConfigForWrite({ provider: 'local', vision }, undefined).vision).toBe(vision);
    }
  });

  it('stores anything else as auto, so the resolver never meets a value it cannot read', () => {
    expect(prepareLlmAddonConfigForWrite({ vision: 'maybe' }, undefined).vision).toBe('auto');
    expect(prepareLlmAddonConfigForWrite({ vision: true }, undefined).vision).toBe('auto');
  });

  it('adds no vision key to a config that sent none', () => {
    expect(prepareLlmAddonConfigForWrite({ provider: 'openai', model: 'm' }, undefined)).not.toHaveProperty('vision');
  });
});
