import { useEffect, useState } from 'react';
import { message } from '@tauri-apps/plugin-dialog';
import { Editor } from './editor/Editor';
import { useDocumentStore } from './state/document';
import { newDoc, openDoc, saveDoc, saveDocAs } from './state/actions';
import { registerMenuEvents } from './menu/menuEvents';
import { toggleTheme } from './styles/theme';
import styles from './App.module.css';

const WELCOME = `# Welcome to KNOT

KNOT is Not Only Typora. Start typing.`;

// Wraps an action with a try/catch that surfaces errors to the user.
// Phase 4 follow-up: actions reject on file I/O failures; without this
// the rejection would be a silent uncaught promise.
function safeAction(name: string, fn: () => Promise<void> | void): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      await message(`${name} failed: ${detail}`, { kind: 'error', title: 'KNOT' });
    }
  };
}

export default function App() {
  const path = useDocumentStore((s) => s.path);
  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);
  const open = useDocumentStore((s) => s.open);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    open({ path: '', content: WELCOME });
    // Bump key once after seeding the welcome content so the Editor mounts
    // with the right initialContent (mount-once contract).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditorKey((k) => k + 1);
  }, [open]);

  useEffect(() => {
    const remountAndRun = async (fn: () => Promise<void> | void): Promise<void> => {
      await fn();
      setEditorKey((k) => k + 1);
    };
    const promise = registerMenuEvents({
      'menu.file.new': safeAction('New', () => remountAndRun(newDoc)),
      'menu.file.open': safeAction('Open', () => remountAndRun(openDoc)),
      'menu.file.save': safeAction('Save', () => saveDoc()),
      'menu.file.save_as': safeAction('Save As', () => saveDocAs()),
      'menu.view.toggle_theme': () => toggleTheme(),
    });
    return () => {
      void promise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.titlebar}>
        <span className={styles.title}>{path ? path.split('/').pop() : 'Untitled'}</span>
      </header>
      <Editor key={editorKey} initialContent={content} onChange={setContent} />
    </div>
  );
}
