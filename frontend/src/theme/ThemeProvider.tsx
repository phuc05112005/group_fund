import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';
type Origin = { x: number; y: number };
interface ThemeCtx {
  theme: Theme;
  /** origin: toạ độ điểm loang tròn (thường là tâm nút bấm) */
  toggle: (origin?: Origin) => void;
}

const KEY = 'gf-theme';
const Ctx = createContext<ThemeCtx | null>(null);

const readInitial = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

const paint = (t: Theme) => {
  const el = document.documentElement;
  el.dataset.theme = t;
  el.classList.toggle('dark', t === 'dark');
  el.style.colorScheme = t;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', t === 'dark' ? '#14100b' : '#e3ebde');
};

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial);

  const commit = useCallback((t: Theme, persist = true) => {
    paint(t);
    setTheme(t);
    if (persist) {
      try { localStorage.setItem(KEY, t); } catch { /* bỏ qua */ }
    }
  }, []);

  // Chưa từng chọn thủ công thì đi theo cài đặt hệ điều hành
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(KEY); } catch { /* bỏ qua */ }
      if (!saved) commit(e.matches ? 'light' : 'dark', false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [commit]);

  const toggle = useCallback((origin?: Origin) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const doc = document as VTDocument;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Trình duyệt không hỗ trợ View Transitions: chuyển màu mượt bằng CSS
    if (!doc.startViewTransition || reduce) {
      const el = document.documentElement;
      el.classList.add('theme-xfade');
      commit(next);
      window.setTimeout(() => el.classList.remove('theme-xfade'), 500);
      return;
    }

    const x = origin?.x ?? innerWidth / 2;
    const y = origin?.y ?? innerHeight / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const vt = doc.startViewTransition(() => {
      flushSync(() => commit(next));
    });
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }, [theme, commit]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>');
  return ctx;
}
