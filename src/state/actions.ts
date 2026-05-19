import { useDocumentStore } from './document';
import { readFile, writeFile, pickFileToOpen, pickFileToSave } from '../io/io';

export function newDoc(): void {
  useDocumentStore.getState().reset();
}

export async function openDoc(): Promise<void> {
  const path = await pickFileToOpen();
  if (!path) return;
  const content = await readFile(path);
  useDocumentStore.getState().open({ path, content });
}

export async function saveDoc(): Promise<void> {
  const state = useDocumentStore.getState();
  let path = state.path;
  if (!path) {
    path = await pickFileToSave();
    if (!path) return;
  }
  await writeFile(path, state.content);
  useDocumentStore.setState({ path, dirty: false });
}

export async function saveDocAs(): Promise<void> {
  const state = useDocumentStore.getState();
  const defaultName =
    state.path != null && state.path !== ''
      ? state.path.split('/').pop() ?? 'Untitled.md'
      : 'Untitled.md';
  const newPath = await pickFileToSave(defaultName);
  if (!newPath) return; // cancel — leave existing path intact
  await writeFile(newPath, state.content);
  useDocumentStore.setState({ path: newPath, dirty: false });
}
