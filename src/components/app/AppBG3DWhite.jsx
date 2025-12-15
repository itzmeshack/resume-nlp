// src/components/app/AppBG3D.jsx
'use client';

import { useEffect, useRef } from 'react';

export default function AppBG3D({
  theme = 'dark',      // 'light' | 'dark'
  pop = true,           // add extra depth & glow
  intensity = 12,       // parallax tilt
  accent = '#2563eb',   // ResumeAI blue
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const onMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
      el.style.setProperty('--rx', `${(y - 0.5) * intensity}deg`);
      el.style.setProperty('--ry', `${-(x - 0.5) * intensity}deg`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={[
        'app-bg-3d fixed inset-0 -z-10 pointer-events-none',
        theme === 'dark' ? 'app-bg-3d--dark' : 'app-bg-3d--light',
        pop ? 'app-bg-3d--pop' : 'app-bg-3d--soft',
      ].join(' ')}
      aria-hidden="true"
      style={{ ['--accent']: accent }}
    >
      {/* Base */}
      <div className="layer base" />
      {/* Sheen/caustics */}
      <div className="layer sheen" />
      {/* Holographic orbs */}
      <div className="layer orbs" />
      {/* Faint grid */}
      <div className="layer grid" />
      {/* Noise / film grain */}
      <div className="layer noise" />
      {/* Vignette edges */}
      <div className="layer vignette" />

      <style jsx global>{`
        .app-bg-3d {
          --mx: 50%;
          --my: 50%;
          --rx: 0deg;
          --ry: 0deg;
          --accent: #2563eb;
        }

        .app-bg-3d .layer {
          position: absolute;
          inset: 0;
          will-change: transform, background, opacity, filter;
        }

        /* LIGHT THEME (Apple-ish white) */
        .app-bg-3d--light {
          --bg0: #ffffff;
          --bg1: #f6f8fb;
          --bg2: #edf2f7;
          --ink: #0a0a0a;
          --grid: rgba(0,0,0,0.06);
          --sheenA: rgba(255,255,255,0.85);
          --sheenB: rgba(255,255,255,0.55);
          --orb1: color-mix(in oklab, var(--accent) 24%, white);
          --orb2: color-mix(in oklab, #8b5cf6 20%, white);
          --shadowTint: rgba(0,0,0,0.08);
        }
        .app-bg-3d--light .base {
          background:
            radial-gradient(1200px circle at var(--mx) var(--my), var(--bg0) 0%, var(--bg1) 58%, var(--bg2) 100%);
        }
        .app-bg-3d--light .sheen {
          mix-blend-mode: screen;
          background:
            radial-gradient(700px circle at calc(var(--mx) + 10%) calc(var(--my) - 10%), var(--sheenA) 0%, transparent 60%),
            radial-gradient(520px circle at calc(var(--mx) - 12%) calc(var(--my) + 12%), var(--sheenB) 0%, transparent 65%);
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
          opacity: 0.8;
        }
        .app-bg-3d--light .orbs {
          background:
            radial-gradient(220px circle at calc(var(--mx) + 22%) calc(var(--my) - 18%), var(--orb1), transparent 55%),
            radial-gradient(180px circle at calc(var(--mx) - 26%) calc(var(--my) + 20%), var(--orb2), transparent 60%);
          filter: blur(18px);
          opacity: 0.45;
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
        }
        .app-bg-3d--light .grid {
          background-image:
            linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px);
          background-size: 36px 36px, 36px 36px;
          mask-image: radial-gradient(900px circle at var(--mx) var(--my), black 55%, transparent 80%);
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
          opacity: 0.5;
        }
        .app-bg-3d--light .vignette {
          background:
            radial-gradient(1400px circle at 50% -15%, rgba(0,0,0,0.06), transparent 55%),
            radial-gradient(1400px circle at 50% 115%, rgba(0,0,0,0.06), transparent 55%);
        }

        /* DARK THEME (black / cyber) */
        .app-bg-3d--dark {
          --bg0: #0a0d12;
          --bg1: #0c1118;
          --bg2: #0f1520;
          --ink: #f5f7fa;
          --grid: rgba(255,255,255,0.06);
          --sheenA: rgba(255,255,255,0.12);
          --sheenB: rgba(255,255,255,0.08);
          --orb1: color-mix(in oklab, var(--accent) 45%, black);
          --orb2: color-mix(in oklab, #8b5cf6 40%, black);
          --shadowTint: rgba(0,0,0,0.5);
        }
        .app-bg-3d--dark .base {
          background:
            radial-gradient(1200px circle at var(--mx) var(--my), var(--bg1) 0%, var(--bg2) 70%, #05070a 100%);
        }
        .app-bg-3d--dark .sheen {
          mix-blend-mode: screen;
          background:
            radial-gradient(700px circle at calc(var(--mx) + 10%) calc(var(--my) - 10%), var(--sheenA) 0%, transparent 60%),
            radial-gradient(520px circle at calc(var(--mx) - 12%) calc(var(--my) + 12%), var(--sheenB) 0%, transparent 65%);
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
          opacity: 0.55;
        }
        .app-bg-3d--dark .orbs {
          background:
            radial-gradient(260px circle at calc(var(--mx) + 24%) calc(var(--my) - 16%), var(--orb1), transparent 58%),
            radial-gradient(200px circle at calc(var(--mx) - 28%) calc(var(--my) + 22%), var(--orb2), transparent 60%);
          filter: blur(22px);
          opacity: 0.55;
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
        }
        .app-bg-3d--dark .grid {
          background-image:
            linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px);
          background-size: 34px 34px, 34px 34px;
          mask-image: radial-gradient(1000px circle at var(--mx) var(--my), black 55%, transparent 82%);
          transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
          opacity: 0.35;
        }
        .app-bg-3d--dark .vignette {
          background:
            radial-gradient(1200px circle at 50% -10%, rgba(0,0,0,0.6), transparent 60%),
            radial-gradient(1200px circle at 50% 110%, rgba(0,0,0,0.6), transparent 60%);
        }

        /* Shared layers */
        .app-bg-3d .noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' opacity='0.035' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        /* POP vs SOFT variants */
        .app-bg-3d--pop .orbs { opacity: 0.6; }
        .app-bg-3d--pop .sheen { opacity: 0.9; }
        .app-bg-3d--pop .grid { opacity: 0.6; filter: saturate(1.05); }
        .app-bg-3d--soft .orbs { opacity: 0.35; }
        .app-bg-3d--soft .sheen { opacity: 0.65; }
        .app-bg-3d--soft .grid { opacity: 0.4; }

        @media (prefers-reduced-motion: reduce) {
          .app-bg-3d .sheen, .app-bg-3d .orbs, .app-bg-3d .grid {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
