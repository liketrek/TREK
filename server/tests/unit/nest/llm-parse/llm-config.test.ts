import { prepareLlmAddonConfigForWrite } from '../../../../src/nest/llm-parse/llm-config';

import { describe, it, expect } from 'vitest';

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

describe('prepareLlmAddonConfigForWrite: back on the shared connection', () => {
  it('LLMCFG-SHARED-001: a config without a provider keeps no key, neither sent nor stored', () => {
    const stored = { provider: 'anthropic', model: 'm', apiKey: 'enc:old' };
    expect(prepareLlmAddonConfigForWrite({ vision: 'on' }, stored)).toEqual({ vision: 'on' });
    expect(prepareLlmAddonConfigForWrite({ apiKey: 'sk-new' }, stored)).toEqual({});
  });
});
