export type Theme = 'system' | 'light' | 'dark';

const KEY = 'knot.theme';
const CYCLE: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };

export function getTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'system';
}

export function setTheme(theme: Theme): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem(KEY);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }
}

export function toggleTheme(): void {
  setTheme(CYCLE[getTheme()]);
}

export function restoreThemeFromStorage(): void {
  const stored = localStorage.getItem(KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored);
  }
}
