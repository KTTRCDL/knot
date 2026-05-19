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
    let cancelled = false;
    const crepe = new Crepe({
      root: ref.current,
      defaultValue: initialContent,
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        if (cancelled) return;
        onChange(markdown);
      });
    });
    crepe.create();
    return () => {
      cancelled = true;
      void crepe.destroy();
    };
    // initialContent and onChange are read once on mount; see EditorProps JSDoc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} role="textbox" className={styles.editor} />;
}
