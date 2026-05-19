import { useState } from 'react';
import { Editor } from './editor/Editor';
import styles from './App.module.css';

const DEFAULT_DOC = `# Welcome to KNOT

KNOT is Not Only Typora. Start typing.`;

export default function App() {
  const [, setContent] = useState(DEFAULT_DOC);
  return (
    <div className={styles.app}>
      <Editor initialContent={DEFAULT_DOC} onChange={setContent} />
    </div>
  );
}
