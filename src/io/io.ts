import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';

const MD_FILTERS = [{ name: 'Markdown', extensions: ['md', 'markdown'] }];

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  await invoke<void>('write_file', { path, content });
}

export async function pickFileToOpen(): Promise<string | null> {
  const result = await openDialog({
    multiple: false,
    directory: false,
    filters: MD_FILTERS,
  });
  if (Array.isArray(result)) return result[0] ?? null;
  return (result as string | null) ?? null;
}

export async function pickFileToSave(defaultName = 'Untitled.md'): Promise<string | null> {
  const result = await saveDialog({
    defaultPath: defaultName,
    filters: MD_FILTERS,
  });
  return (result as string | null) ?? null;
}
