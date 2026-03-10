"use client";

import React from "react";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  hue: number; // para variar entre blanco/azul/ámbar
};

export default function SpaceParticles({
  density = 160,
  speed = 0.22,
}: {
  density?: number;
  speed?: number;
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

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ps: P[] = [];

    const randHue = () => {
      // mezcla: blancos, azules, y algunos cálidos
      const roll = Math.random();
      if (roll < 0.70) return 210; // blanco frío
      if (roll < 0.92) return 200; // azul
      return 35; // ámbar
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ps.length = 0;
      for (let i = 0; i < density; i++) {
        ps.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 0.35 + Math.random() * 1.35,
          a: 0.06 + Math.random() * 0.18,
          hue: randHue(),
        });
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      // additive blending para “brillos”
      ctx.globalCompositeOperation = "lighter";

      // polvo
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // glow suave (3 capas)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `hsla(${p.hue}, 90%, 85%, ${p.a})`);
        g.addColorStop(0.45, `hsla(${p.hue}, 90%, 70%, ${p.a * 0.35})`);
        g.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // volver a normal para no “lavar” todo
      ctx.globalCompositeOperation = "source-over";

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
  }, [density, speed]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true" />;
}