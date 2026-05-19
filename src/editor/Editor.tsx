import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import styles from './Editor.module.css';

export interface EditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
}

export function Editor({ initialContent, onChange }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const crepe = new Crepe({
      root: ref.current,
      defaultValue: initialContent,
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChange(markdown);
      });
    });
    crepe.create();
    return () => {
      crepe.destroy();
    };
    // Crepe is initialized once on mount; subsequent prop changes are
    // handled by the editor instance itself, not by re-creating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} role="textbox" className={styles.editor} />;
}
