import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/event', () => {
  const listeners = new Map<string, (event: { payload: unknown }) => void>();
  return {
    listen: vi.fn((eventName: string, cb: (event: { payload: unknown }) => void) => {
      listeners.set(eventName, cb);
      return Promise.resolve(() => listeners.delete(eventName));
    }),
    __fire: (eventName: string, payload: unknown) => listeners.get(eventName)?.({ payload }),
  };
});

import * as event from '@tauri-apps/api/event';
import { registerMenuEvents, type MenuHandlers } from '../menuEvents';

describe('menu event dispatcher', () => {
  it('routes each menu id to its handler', async () => {
    const handlers: MenuHandlers = {
      'menu.file.new': vi.fn(),
      'menu.file.open': vi.fn(),
      'menu.file.save': vi.fn(),
      'menu.file.save_as': vi.fn(),
      'menu.view.toggle_theme': vi.fn(),
    };
    await registerMenuEvents(handlers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event as any).__fire('menu', 'menu.file.open');
    expect(handlers['menu.file.open']).toHaveBeenCalledOnce();
  });

  it('ignores unknown menu ids', async () => {
    const handlers: MenuHandlers = { 'menu.file.new': vi.fn() };
    await registerMenuEvents(handlers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => (event as any).__fire('menu', 'menu.unknown')).not.toThrow();
  });
});
