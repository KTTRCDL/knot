import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, pickFileToOpen, pickFileToSave } from '../io';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('io', () => {
  it('readFile invokes read_file command', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('# content');
    const r = await readFile('/tmp/a.md');
    expect(invoke).toHaveBeenCalledWith('read_file', { path: '/tmp/a.md' });
    expect(r).toBe('# content');
  });

  it('writeFile invokes write_file command', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await writeFile('/tmp/a.md', 'hi');
    expect(invoke).toHaveBeenCalledWith('write_file', { path: '/tmp/a.md', content: 'hi' });
  });

  it('pickFileToOpen returns selected path or null', async () => {
    (openDialog as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/x.md');
    const r = await pickFileToOpen();
    expect(r).toBe('/tmp/x.md');
  });

  it('pickFileToOpen returns null when dialog cancelled', async () => {
    (openDialog as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const r = await pickFileToOpen();
    expect(r).toBeNull();
  });

  it('pickFileToSave defaults to .md extension', async () => {
    (saveDialog as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    const r = await pickFileToSave();
    expect(saveDialog).toHaveBeenCalledWith(expect.objectContaining({
      defaultPath: expect.any(String),
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    }));
    expect(r).toBe('/tmp/new.md');
  });
});
