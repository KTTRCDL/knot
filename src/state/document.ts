import { create } from 'zustand';

export interface DocumentState {
  path: string | null;
  content: string;
  dirty: boolean;
  setContent: (content: string) => void;
  open: (doc: { path: string; content: string }) => void;
  markClean: () => void;
  reset: () => void;
}

const INITIAL: Pick<DocumentState, 'path' | 'content' | 'dirty'> = {
  path: null,
  content: '',
  dirty: false,
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...INITIAL,
  setContent: (content) => {
    if (content === get().content) return;
    set({ content, dirty: true });
  },
  open: ({ path, content }) => set({ path, content, dirty: false }),
  markClean: () => set({ dirty: false }),
  reset: () => set({ ...INITIAL }),
}));
