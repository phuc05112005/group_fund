import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'gf_theme';
const listeners = new Set<() => void>();

export const getTheme = (): Theme => {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const apply = (t: Theme) => document.documentElement.setAttribute('data-theme', t);

export const initTheme = () => apply(getTheme());

export const setTheme = (t: Theme) => {
  localStorage.setItem(KEY, t);
  apply(t);
  listeners.forEach((l) => l());
};

export const useTheme = () => {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getTheme
  );
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
};