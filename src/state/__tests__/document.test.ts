import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../document';

describe('document store', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  it('starts with an empty untitled document', () => {
    const s = useDocumentStore.getState();
    expect(s.content).toBe('');
    expect(s.path).toBeNull();
    expect(s.dirty).toBe(false);
  });

  it('marks dirty when content changes', () => {
    useDocumentStore.getState().setContent('hello');
    const s = useDocumentStore.getState();
    expect(s.content).toBe('hello');
    expect(s.dirty).toBe(true);
  });

  it('does not mark dirty when setting same content', () => {
    useDocumentStore.getState().setContent('hello');
    useDocumentStore.getState().markClean();
    useDocumentStore.getState().setContent('hello');
    expect(useDocumentStore.getState().dirty).toBe(false);
  });

  it('open() replaces content + path and clears dirty', () => {
    useDocumentStore.getState().setContent('dirty');
    useDocumentStore.getState().open({ path: '/tmp/a.md', content: 'fresh' });
    const s = useDocumentStore.getState();
    expect(s.path).toBe('/tmp/a.md');
    expect(s.content).toBe('fresh');
    expect(s.dirty).toBe(false);
  });
});
