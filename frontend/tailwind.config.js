/** @type {import('tailwindcss').Config} */
// Toàn bộ màu đi qua biến CSS (xem src/index.css) nên các trang cũ dùng
// bg-slate-900, text-white, text-emerald-400... tự đổi theo chế độ sáng/tối,
// không cần sửa từng file.
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (family, steps) =>
  Object.fromEntries(steps.map((s) => [s, c(`${family}-${s}`)]));
 
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: c('ink'),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950]),
        emerald: scale('emerald', [300, 400, 500, 600]),
        amber: scale('amber', [300, 400, 500, 600]),
        rose: scale('rose', [300, 400, 500, 600]),
        blue: scale('blue', [300, 400, 500, 600]),
        purple: scale('purple', [300, 400, 500, 600]),
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Fraunces', '"Be Vietnam Pro"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--emerald-500) / 0.14), 0 18px 48px -18px rgb(var(--emerald-500) / 0.38)',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-up': 'fadeUp .6s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fadeIn .5s ease both',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};