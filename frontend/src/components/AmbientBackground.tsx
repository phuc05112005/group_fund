import { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Nền động: những đồng xu mỏng xoay lật, trôi chậm lên như tiền đang "tích góp",
 * cùng vài lớp sóng vàng – lục dưới đáy như đường tăng trưởng của quỹ.
 * Rất nhẹ (canvas, <= 34 xu), tự dừng khi chuyển tab, tôn trọng reduced-motion.
 */
type Coin = {
  x: number; y: number; r: number; vy: number;
  sway: number; phase: number; spin: number; rot: number; a: number;
};

const PALETTE = {
  dark: { coin: '224,176,79', rim: '255,236,181', waveA: '207,156,63', waveB: '58,160,115', k: 1 },
  light: { coin: '176,118,20', rim: '104,66,8', waveA: '176,118,20', waveB: '5,150,105', k: 0.85 },
} as const;

export function AmbientBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    themeRef.current = theme;
    redrawRef.current(); // chế độ reduced-motion: vẽ lại 1 khung theo màu mới
  }, [theme]);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, last = 0, t = 0;
    let coins: Coin[] = [];
    const mouse = { x: -9999, y: -9999 };

    const spawn = (initial: boolean): Coin => {
      const depth = Math.random(); // 0 = xa, 1 = gần
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 30,
        r: 5 + depth * 15,
        vy: 8 + depth * 22,
        sway: 10 + Math.random() * 24,
        phase: Math.random() * Math.PI * 2,
        spin: 0.6 + Math.random() * 1.6,
        rot: Math.random() * Math.PI * 2,
        a: 0.1 + depth * 0.28,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(34, Math.max(12, (w * h) / 52000)));
      coins = Array.from({ length: n }, () => spawn(true));
    };

    const wave = (yBase: number, amp: number, len: number, speed: number, ph: number, rgb: string, a: number) => {
      ctx.beginPath();
      for (let x = 0; x <= w + 8; x += 8) {
        const y = yBase + Math.sin(x / len + t * speed + ph) * amp + Math.sin(x / (len * 0.47) + t * speed * 1.3) * amp * 0.35;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rgb},${a * 1.6})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, yBase - amp, 0, h);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const drawCoin = (c: Coin, p: (typeof PALETTE)[keyof typeof PALETTE]) => {
      const face = Math.abs(Math.cos(c.rot)); // lật như đồng xu thật
      const rx = Math.max(c.r * face, 0.6);
      const a = c.a * p.k;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx, c.r, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.coin},${a * 0.55})`;
      ctx.fill();
      ctx.lineWidth = Math.max(1, c.r * 0.14);
      ctx.strokeStyle = `rgba(${p.rim},${a})`;
      ctx.stroke();
      if (face > 0.25 && c.r > 7) {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, rx * 0.62, c.r * 0.62, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${p.rim},${a * 0.7})`;
        ctx.stroke();
      }
    };

    const render = (dt: number) => {
      const p = PALETTE[themeRef.current];
      ctx.clearRect(0, 0, w, h);
      wave(h * 0.86, 16, 150, 0.35, 0, p.waveB, 0.07 * p.k);
      wave(h * 0.9, 20, 210, 0.25, 2, p.waveA, 0.08 * p.k);
      wave(h * 0.95, 14, 120, 0.45, 4, p.waveB, 0.06 * p.k);

      for (const c of coins) {
        c.y -= c.vy * dt;
        c.rot += c.spin * dt;
        const sx = c.x + Math.sin(t * 0.6 + c.phase) * c.sway;
        // tránh con trỏ chuột nhẹ nhàng
        const dx = sx - mouse.x, dy = c.y - mouse.y, d = Math.hypot(dx, dy);
        let ox = 0, oy = 0;
        if (d < 130 && d > 0) { const f = (130 - d) / 130; ox = (dx / d) * f * 28; oy = (dy / d) * f * 28; }
        const draw = { ...c, x: sx + ox, y: c.y + oy };
        drawCoin(draw, p);
        if (c.y < -30) Object.assign(c, spawn(false));
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      t += dt;
      render(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? stop() : start());
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'touch') { mouse.x = e.clientX; mouse.y = e.clientY; } };

    resize();
    redrawRef.current = () => { if (reduce) render(0); };
    if (reduce) render(0); else start();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      redrawRef.current = () => {};
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
