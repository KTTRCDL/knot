import { useEffect, useState } from 'react';
import { Editor } from './editor/Editor';
import { useDocumentStore } from './state/document';
import styles from './App.module.css';

const WELCOME = `# Welcome to KNOT

KNOT is Not Only Typora. Start typing.`;

export default function App() {
  const setContent = useDocumentStore((s) => s.setContent);
  const open = useDocumentStore((s) => s.open);
  const content = useDocumentStore((s) => s.content);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    open({ path: '', content: WELCOME });
    // Bump the key to remount the Editor so it reads the welcome content
    // from the store (Editor is mount-once; see EditorProps JSDoc).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditorKey((k) => k + 1);
  }, [open]);

  return (
    <div className={styles.app}>
      <Editor key={editorKey} initialContent={content} onChange={setContent} />
    </div>
  );
}
