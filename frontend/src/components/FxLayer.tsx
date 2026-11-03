import { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Hiệu ứng tung xu toàn ứng dụng, không cần sửa từng nút:
 *  - Click / chạm / Enter vào nút, link, thẻ có cursor-pointer → xu bật tung và rơi.
 *  - Rê chuột qua nút → vài hạt xu nhỏ nảy lên.
 *  - Nút nguy hiểm (màu rose) chỉ có tia lửa đỏ, không tung xu.
 *  - Muốn tắt ở một phần tử: thêm data-fx="off". Muốn bật ở phần tử khác: data-fx.
 */
type Hue = 'gold' | 'green' | 'rose';
type Kind = 'coin' | 'spark';
interface P {
  kind: Kind; hue: Hue;
  x: number; y: number; vx: number; vy: number; g: number;
  r: number; rot: number; vr: number; life: number; max: number;
}

const TARGET = 'button, a[href], [role="button"], [role="switch"], summary, [data-fx], .cursor-pointer';
const COLORS = {
  dark: { gold: ['233,189,92', '255,238,190'], green: ['16,185,129', '167,243,208'], rose: ['244,63,94', '253,164,175'] },
  light: { gold: ['190,132,24', '110,70,8'], green: ['5,150,105', '6,78,59'], rose: ['225,29,72', '159,18,57'] },
} as const;
const MAX = 180;

export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;

    let w = 0, h = 0, raf = 0, last = 0;
    const ps: P[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = `${w}px`; cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const burst = (x: number, y: number, hue: Hue) => {
      const coins = hue === 'rose' ? 0 : 10;
      const sparks = hue === 'rose' ? 8 : 6;
      for (let i = 0; i < coins; i++) {
        const ang = -Math.PI / 2 + rnd(-0.75, 0.75) * (Math.PI / 2);
        const sp = rnd(240, 470);
        const life = rnd(0.9, 1.4);
        ps.push({ kind: 'coin', hue: i % 5 === 0 ? 'green' : hue, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 980, r: rnd(6, 10), rot: rnd(0, 6.28), vr: rnd(8, 18) * (Math.random() < 0.5 ? -1 : 1), life, max: life });
      }
      for (let i = 0; i < sparks; i++) {
        const ang = rnd(0, Math.PI * 2);
        const sp = rnd(90, 230);
        const life = rnd(0.45, 0.8);
        ps.push({ kind: 'spark', hue, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0, r: rnd(3, 6), rot: rnd(0, 1.5), vr: rnd(-3, 3), life, max: life });
      }
    };

    const dust = (x: number, y: number, hue: Hue) => {
      const n = hue === 'rose' ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const life = rnd(0.55, 0.85);
        ps.push({ kind: hue === 'rose' ? 'spark' : 'coin', hue, x: x + rnd(-6, 6), y: y + rnd(-4, 4), vx: rnd(-50, 50), vy: rnd(-150, -70), g: 260, r: rnd(3, 4.6), rot: rnd(0, 6.28), vr: rnd(6, 12), life, max: life });
      }
    };

    const draw = (p: P) => {
      const [fill, rim] = COLORS[themeRef.current][p.hue];
      const a = Math.min(1, (p.life / p.max) / 0.35); // mờ dần ở 35% cuối
      if (p.kind === 'coin') {
        const face = Math.abs(Math.cos(p.rot));
        const rx = Math.max(p.r * face, 0.7);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rx, p.r, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${fill},${0.92 * a})`;
        ctx.fill();
        ctx.lineWidth = Math.max(1, p.r * 0.16);
        ctx.strokeStyle = `rgba(${rim},${a})`;
        ctx.stroke();
        if (face > 0.3 && p.r > 5) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx * 0.58, p.r * 0.58, 0, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(${rim},${0.7 * a})`;
          ctx.stroke();
        }
      } else {
        // tia sáng 4 cánh
        const s = p.r * (0.6 + 0.4 * (p.life / p.max));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fillStyle = `rgba(${rim},${a})`;
        ctx.fill();
        ctx.restore();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= dt;
        if (p.life <= 0 || p.y > h + 40) { ps.splice(i, 1); continue; }
        p.vy += p.g * dt;
        p.vx *= 1 - 0.9 * dt; // lực cản không khí
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        draw(p);
      }
      raf = ps.length ? requestAnimationFrame(loop) : 0;
      if (!ps.length) ctx.clearRect(0, 0, w, h);
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    const pick = (t: EventTarget | null): { el: Element; hue: Hue } | null => {
      if (!(t instanceof Element)) return null;
      let el: Element | null = null;
      try { el = t.closest(TARGET); } catch { return null; }
      if (!el || el.closest('[data-fx="off"]')) return null;
      if (el.matches(':disabled, [aria-disabled="true"]')) return null;
      const hue: Hue = /\brose\b|-rose-/.test(String((el as HTMLElement).className)) ? 'rose' : 'gold';
      return { el, hue };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const hit = pick(e.target);
      if (!hit || ps.length > MAX) return;
      burst(e.clientX, e.clientY, hit.hue);
      kick();
    };
    // Enter / Space trên bàn phím: click có detail = 0
    const onClick = (e: MouseEvent) => {
      if (e.detail !== 0) return;
      const hit = pick(e.target);
      if (!hit || ps.length > MAX) return;
      const r = hit.el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, hit.hue);
      kick();
    };

    let lastEl: Element | null = null;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const hit = pick(e.target);
      if (!hit) { lastEl = null; return; }
      const now = performance.now();
      const entering = hit.el !== lastEl;
      if ((entering || now - lastT > 150) && ps.length < MAX) {
        dust(e.clientX, e.clientY, hit.hue);
        if (entering) dust(e.clientX, e.clientY, hit.hue);
        lastT = now;
        kick();
      }
      lastEl = hit.el;
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" />;
}
