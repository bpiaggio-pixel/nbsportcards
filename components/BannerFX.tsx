"use client";
import React from "react";

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  kind: "dust" | "bokeh" | "spark";
  hue: number;
  tw: number;
};

export default function BannerFX({
  density = 220,
}: {
  density?: number;
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const dots: Dot[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const pickHue = () => {
      const r = Math.random();
      if (r < 0.72) return 200; // cyan frío
      if (r < 0.96) return 210; // azul NB-ish
      return 38; // ámbar mínimo
    };

    const addDot = (): Dot => {
      const r = Math.random();
      const kind: Dot["kind"] =
        r < 0.74 ? "dust" : r < 0.96 ? "bokeh" : "spark";

      const baseR =
        kind === "dust"
          ? rand(0.35, 1.2)
          : kind === "bokeh"
            ? rand(10, 24)
            : rand(0.7, 1.25);

      const speed =
        kind === "dust"
          ? rand(0.09, 0.24)
          : kind === "bokeh"
            ? rand(0.02, 0.07)
            : rand(0.38, 0.72);

      const ang = rand(-0.3, 0.3) + Math.PI;

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed * 0.32,
        r: baseR,
        a:
          kind === "dust"
            ? rand(0.08, 0.22)
            : kind === "bokeh"
              ? rand(0.05, 0.11)
              : rand(0.28, 0.6),
        kind,
        hue: pickHue(),
        tw: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots.length = 0;
      for (let i = 0; i < density; i++) dots.push(addDot());
    };

    const paintBackgroundAtmosphere = () => {
      // wash azul muy suave
      const n1 = ctx.createRadialGradient(
        w * 0.62,
        h * 0.38,
        0,
        w * 0.62,
        h * 0.38,
        Math.max(w, h) * 0.72
      );
n1.addColorStop(0, "rgba(0,168,255,0.22)");
n1.addColorStop(0.28, "rgba(56,189,248,0.12)");
n1.addColorStop(0.52, "rgba(125,211,252,0.05)");
      n1.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = n1;
      ctx.fillRect(0, 0, w, h);

      // wash secundario frío
      const n2 = ctx.createRadialGradient(
        w * 0.24,
        h * 0.7,
        0,
        w * 0.24,
        h * 0.7,
        Math.max(w, h) * 0.52
      );
n2.addColorStop(0, "rgba(59,130,246,0.09)");
n2.addColorStop(0.45, "rgba(59,130,246,0.04)");
      n2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = n2;
      ctx.fillRect(0, 0, w, h);

      // toque ámbar muy mínimo
      const n3 = ctx.createRadialGradient(
        w * 0.82,
        h * 0.26,
        0,
        w * 0.82,
        h * 0.26,
        Math.max(w, h) * 0.3
      );
      n3.addColorStop(0, "rgba(245,158,11,0.035)");
      n3.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = n3;
      ctx.fillRect(0, 0, w, h);
    };

    const step = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      paintBackgroundAtmosphere();

      // en fondo blanco funciona mejor "source-over" con glow controlado
      ctx.globalCompositeOperation = "source-over";

      for (const p of dots) {
        const wobble = Math.sin(t * 0.8 + p.tw) * 0.12;
        p.x += p.vx + wobble * 0.14;
        p.y += p.vy + Math.cos(t * 0.7 + p.tw) * 0.025;

        if (p.x < -70) p.x = w + 70;
        if (p.x > w + 70) p.x = -70;
        if (p.y < -70) p.y = h + 70;
        if (p.y > h + 70) p.y = -70;

        const tw = 0.68 + 0.32 * Math.sin(t * 0.95 + p.tw);

        if (p.kind === "dust") {
          const rr = p.r * 11;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
g.addColorStop(0, `hsla(${p.hue}, 100%, 56%, ${p.a * tw * 1.15})`);
g.addColorStop(0.4, `hsla(${p.hue}, 92%, 68%, ${p.a * 0.42})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.kind === "bokeh") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
g.addColorStop(0, `hsla(${p.hue}, 100%, 58%, ${p.a * 1.1})`);
g.addColorStop(0.55, `hsla(${p.hue}, 90%, 72%, ${p.a * 0.46})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.kind === "spark") {
          const len = 34;
          const x2 = p.x + p.vx * len;
          const y2 = p.y + p.vy * len;

          const streak = ctx.createLinearGradient(x2, y2, p.x, p.y);
          streak.addColorStop(0, "rgba(255,255,255,0)");
          streak.addColorStop(0.3, `hsla(${p.hue}, 95%, 58%, ${p.a * 0.16})`);
          streak.addColorStop(0.72, `hsla(${p.hue}, 95%, 62%, ${p.a * 0.48})`);
          streak.addColorStop(1, `hsla(${p.hue}, 100%, 50%, ${p.a})`);

          ctx.strokeStyle = streak;
          ctx.lineWidth = 1.35;
          ctx.lineCap = "round";
          ctx.shadowBlur = 8;
          ctx.shadowColor = `hsla(${p.hue}, 100%, 55%, ${p.a * 0.55})`;

          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          const head = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 3.2);
          head.addColorStop(0, `hsla(${p.hue}, 100%, 48%, ${p.a})`);
          head.addColorStop(0.55, `hsla(${p.hue}, 100%, 68%, ${p.a * 0.35})`);
          head.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = head;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";

          if (Math.random() < 0.004) {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
          }
        }
      }

      // flare central mejor para fondo blanco
      const y = h * 0.53;
      const flare = ctx.createLinearGradient(0, y, w, y);
flare.addColorStop(0, "rgba(0,168,255,0)");
flare.addColorStop(0.2, "rgba(56,189,248,0.12)");
flare.addColorStop(0.5, "rgba(0,168,255,0.42)");
flare.addColorStop(0.8, "rgba(56,189,248,0.12)");
flare.addColorStop(1, "rgba(0,168,255,0)");
      ctx.fillStyle = flare;
ctx.fillRect(0, y - 2, w, 4);
      raf = requestAnimationFrame(step);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    step();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}