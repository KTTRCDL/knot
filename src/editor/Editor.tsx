import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import styles from './Editor.module.css';

/**
 * Props for the {@link Editor} component.
 *
 * NOTE: This editor uses a mount-once design. Crepe owns its internal state
 * after the first render, so the props below are READ ONLY ONCE on mount:
 *
 *  - `initialContent` is captured on mount. Changing it later does NOT update
 *    the editor's content. To reset the editor, remount it (e.g. change the
 *    React `key` prop on the parent).
 *  - `onChange` is captured on mount. Changing its identity later does NOT
 *    re-subscribe the listener; subsequent edits will still call the original
 *    callback. Pass a stable callback (e.g. a Zustand setter or `useRef`-
 *    backed function), or remount the Editor when the callback must change.
 */
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
