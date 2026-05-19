import { describe, it, expect, beforeEach } from 'vitest';
import { toggleTheme, setTheme, getTheme } from '../theme';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

describe('theme', () => {
  it('defaults to system (no attribute)', () => {
    expect(getTheme()).toBe('system');
  });

  it('setTheme writes attribute and localStorage', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('knot.theme')).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('toggleTheme cycles system -> dark -> light -> system', () => {
    expect(getTheme()).toBe('system');
    toggleTheme();
    expect(getTheme()).toBe('dark');
    toggleTheme();
    expect(getTheme()).toBe('light');
    toggleTheme();
    expect(getTheme()).toBe('system');
    expect(localStorage.getItem('knot.theme')).toBeNull();
  });
});
