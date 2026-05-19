import { listen } from '@tauri-apps/api/event';

export type MenuHandlers = Record<string, () => void | Promise<void>>;

export async function registerMenuEvents(handlers: MenuHandlers): Promise<() => void> {
  const unlisten = await listen<string>('menu', (event) => {
    const handler = handlers[event.payload];
    if (handler) void handler();
  });
  return unlisten;
}
