import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

/** Công tắc sáng/tối: núm trượt là một đồng xu. */
export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={`relative h-9 w-[72px] shrink-0 rounded-full border border-slate-700 bg-slate-900/70 shadow-md backdrop-blur-md transition-colors hover:border-amber-500/60 ${
        floating ? 'fixed bottom-5 right-5 z-40' : ''
      }`}
    >
      <Sun
        size={14}
        aria-hidden
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400 transition-opacity duration-300 ${dark ? 'opacity-60' : 'opacity-0'}`}
      />
      <Moon
        size={14}
        aria-hidden
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity duration-300 ${dark ? 'opacity-0' : 'opacity-70'}`}
      />
      <span
        className="coin-knob absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]"
        style={{ transform: `translateX(${dark ? 36 : 0}px)` }}
      >
        {dark ? <Moon size={14} strokeWidth={2.4} aria-hidden /> : <Sun size={14} strokeWidth={2.4} aria-hidden />}
      </span>
    </button>
  );
}
