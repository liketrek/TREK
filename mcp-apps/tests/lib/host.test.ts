import type { App } from '@modelcontextprotocol/ext-apps';
import { describe, expect, it, vi } from 'vitest';
import { callTrekTool, hostActions, readTrekTool, trekToolSucceeded } from '../../src/lib/host';

const hostWith = (methods: Record<string, unknown>) => methods as unknown as App;

describe('callTrekTool', () => {
  it('APPS-HOST-001: calls the tool on the host session and hands back its answer', async () => {
    const answer = { content: [], structuredContent: { ok: 1 } };
    const callServerTool = vi.fn(async () => answer);
    await expect(callTrekTool(hostWith({ callServerTool }), 'list_trips', { a: 1 })).resolves.toBe(answer);
    expect(callServerTool).toHaveBeenCalledWith({ name: 'list_trips', arguments: { a: 1 } });
  });

  it.each([
    ['no host yet', null],
    ['a refusal', hostWith({ callServerTool: async () => ({ content: [], isError: true }) })],
    [
      'a failed call',
      hostWith({
        callServerTool: async () => {
          throw new Error('gone');
        },
      }),
    ],
  ])('APPS-HOST-002: reads %s as no answer', async (_case, app) => {
    await expect(callTrekTool(app, 'toggle_todo', {})).resolves.toBeNull();
    await expect(trekToolSucceeded(app, 'toggle_todo', {})).resolves.toBe(false);
    await expect(readTrekTool(app, 'get_trip_map', {})).rejects.toThrow('get_trip_map gave no result');
  });

  it('APPS-HOST-003: a write TREK carried out succeeds, and a read hands back the structured result', async () => {
    const app = hostWith({ callServerTool: async () => ({ content: [], structuredContent: { page: 2 } }) });
    await expect(trekToolSucceeded(app, 'toggle_todo', {})).resolves.toBe(true);
    await expect(readTrekTool(app, 'get_trip_map', {})).resolves.toEqual({ page: 2 });
  });
});

describe('hostActions', () => {
  it('APPS-HOST-004: opens a link, and takes a refused one quietly', async () => {
    const openLink = vi.fn(async () => {
      throw new Error('no browser');
    });
    hostActions(hostWith({ openLink })).open('https://trek.example/trips/1');
    expect(openLink).toHaveBeenCalledWith({ url: 'https://trek.example/trips/1' });
    expect(() => hostActions(null).open('https://trek.example')).not.toThrow();
  });

  it('APPS-HOST-005: says whether the host gave the whole screen', async () => {
    const granted = hostWith({ requestDisplayMode: async () => ({ mode: 'fullscreen' }) });
    const inline = hostWith({ requestDisplayMode: async () => ({ mode: 'inline' }) });
    const refusing = hostWith({
      requestDisplayMode: async () => {
        throw new Error('no fullscreen');
      },
    });
    await expect(hostActions(granted).expand()).resolves.toBe(true);
    await expect(hostActions(inline).expand()).resolves.toBe(false);
    await expect(hostActions(refusing).expand()).resolves.toBe(false);
    await expect(hostActions(null).expand()).resolves.toBe(false);
  });
});
