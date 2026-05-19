import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentStore } from '../document';

vi.mock('../../io/io', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  pickFileToOpen: vi.fn(),
  pickFileToSave: vi.fn(),
}));

import * as io from '../../io/io';
import { newDoc, openDoc, saveDoc, saveDocAs } from '../actions';

beforeEach(() => {
  vi.clearAllMocks();
  useDocumentStore.getState().reset();
});

describe('document actions', () => {
  it('newDoc clears the store to an untitled empty doc', () => {
    useDocumentStore.getState().open({ path: '/x.md', content: 'old' });
    newDoc();
    const s = useDocumentStore.getState();
    expect(s.path).toBeNull();
    expect(s.content).toBe('');
    expect(s.dirty).toBe(false);
  });

  it('openDoc shows dialog, reads file, populates store', async () => {
    (io.pickFileToOpen as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/a.md');
    (io.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('# hi');
    await openDoc();
    const s = useDocumentStore.getState();
    expect(s.path).toBe('/tmp/a.md');
    expect(s.content).toBe('# hi');
    expect(s.dirty).toBe(false);
  });

  it('openDoc does nothing when dialog is cancelled', async () => {
    (io.pickFileToOpen as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await openDoc();
    expect(io.readFile).not.toHaveBeenCalled();
  });

  it('saveDoc writes to existing path when set', async () => {
    useDocumentStore.getState().open({ path: '/tmp/a.md', content: 'x' });
    useDocumentStore.getState().setContent('y');
    await saveDoc();
    expect(io.writeFile).toHaveBeenCalledWith('/tmp/a.md', 'y');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('saveDoc shows save dialog when path is null, then writes', async () => {
    useDocumentStore.getState().setContent('hello');
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    await saveDoc();
    expect(io.writeFile).toHaveBeenCalledWith('/tmp/new.md', 'hello');
    expect(useDocumentStore.getState().path).toBe('/tmp/new.md');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('saveDoc aborts when save dialog cancelled', async () => {
    useDocumentStore.getState().setContent('hello');
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await saveDoc();
    expect(io.writeFile).not.toHaveBeenCalled();
  });

  it('saveDocAs writes to chosen path and updates store', async () => {
    useDocumentStore.getState().open({ path: '/tmp/old.md', content: 'data' });
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    await saveDocAs();
    expect(io.writeFile).toHaveBeenCalledWith('/tmp/new.md', 'data');
    expect(useDocumentStore.getState().path).toBe('/tmp/new.md');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('saveDocAs preserves existing path when dialog is cancelled', async () => {
    useDocumentStore.getState().open({ path: '/tmp/keep.md', content: 'data' });
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await saveDocAs();
    expect(io.writeFile).not.toHaveBeenCalled();
    // Critical: path must NOT be cleared just because dialog was cancelled
    expect(useDocumentStore.getState().path).toBe('/tmp/keep.md');
  });

  it('saveDocAs defaults the dialog name to the current basename', async () => {
    useDocumentStore.getState().open({ path: '/Users/me/notes/Q3.md', content: 'data' });
    (io.pickFileToSave as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new.md');
    await saveDocAs();
    expect(io.pickFileToSave).toHaveBeenCalledWith('Q3.md');
  });
});
