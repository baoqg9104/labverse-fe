import React, { useEffect, useMemo, useRef, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fontReady, setFontReady] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Precompute randomness per mount to avoid changing on re-render
  const rains = useMemo(() => {
    const count = 20;
    return Array.from({ length: count }).map(() => ({
      left: Math.min(96, Math.max(4, Math.random() * 100)),
      delay: -(Math.random() * 1.4).toFixed(2) + "s", // negative delay so some start mid-fall
      duration: (1.2 + Math.random() * 0.9).toFixed(2) + "s", // 1.2s - 2.1s
      top: -(10 + Math.random() * 50).toFixed(0) + "%", // -10% to -60%
      token: Math.random() > 0.66 ? "{  }" : Math.random() > 0.5 ? "01" : "<>",
      opacity: (0.45 + Math.random() * 0.4).toFixed(2),
      sizeRem: (0.75 + Math.random() * 0.9).toFixed(2), // 0.75rem - 1.65rem
    }));
  }, []);

  const orbitDots = useMemo(() => {
    const count = 10;
    const sizePx = () => Math.round(7 + Math.random() * 10); // 7-17px
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const radii = [
      "animate-orbit-sm",
      "animate-orbit",
      "animate-orbit-lg",
      "animate-orbit-xl",
    ] as const;
    const colors = [
      "from-cyan-400 to-lime-400",
      "from-cyan-300 to-emerald-300",
      "from-teal-400 to-cyan-400",
      "from-lime-300 to-cyan-300",
    ];
    return Array.from({ length: count }).map(() => ({
      left: "50%",
      top: "50%",
      size: sizePx(),
      delay: -(Math.random() * 2).toFixed(2) + "s",
      duration: (1.8 + Math.random() * 1.6).toFixed(2) + "s",
      radiusClass: pick([...radii]),
      colorClass: pick(colors),
      blur: Math.random() > 0.5 ? "blur-[0.5px]" : "",
      opacity: (0.85 + Math.random() * 0.15).toFixed(2),
    }));
  }, []);

  useEffect(() => {
    // Detect font readiness to avoid logo text flicker
    let cancelled = false;
    if (document && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setFontReady(true);
      });
    } else {
      setFontReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, [onFinish]);

  // Animate circular progress ring; finish when min time elapsed and resources ready
  // Generate a unique, monotonic random progress curve per mount
  // Linear progress: always t in [0,1]
  const progressCurveFn = useMemo(
    () => (t: number) => Math.max(0, Math.min(1, t)),
    []
  );

  useEffect(() => {
    const MIN_SHOW = 1400; // ms minimal display duration
    const SOFT_MAX = 2200; // ms safety cap to force complete
    const FADE_MS = 500;
    startRef.current = null;
    let finished = false;

    const animate = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / MIN_SHOW);
      const curveVal = progressCurveFn(t);
      progressRef.current = curveVal;
      setProgress(curveVal);

      // If progress is done and resources are ready, fade out
      if (!finished && t >= 1 && fontReady && imgReady) {
        finished = true;
        setFadeOut(true);
        setTimeout(() => onFinish(), FADE_MS);
        rafRef.current = null;
        return;
      }
      // If hard timeout, fade out regardless
      if (!finished && elapsed >= SOFT_MAX) {
        finished = true;
        setFadeOut(true);
        setTimeout(() => onFinish(), FADE_MS);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontReady, imgReady, progressCurveFn]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(1200px 600px at 50% 20%, rgba(6,182,212,0.12), transparent 60%), linear-gradient(135deg, #070b14 0%, #0b1020 50%, #0b132b 100%)",
      }}
    >
      {/* Soft gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[30rem] h-[30rem] -top-24 -left-24 rounded-full blur-[100px] opacity-60 animate-blob"
          style={{
            background:
              "radial-gradient(closest-side, rgba(6,182,212,0.55), rgba(6,182,212,0.2), transparent)",
          }}
        />
        <div
          className="absolute w-[28rem] h-[28rem] -bottom-28 -right-24 rounded-full blur-[100px] opacity-60 animate-blob"
          style={{
            background:
              "radial-gradient(closest-side, rgba(163,230,53,0.45), rgba(163,230,53,0.18), transparent)",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Radar sweep */}
      <div className="pointer-events-none absolute w-[640px] h-[640px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/20">
        <div
          className="absolute inset-0 rounded-full opacity-30 mix-blend-screen animate-sweep-slow"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(34,211,238,0.0) 0deg, rgba(34,211,238,0.25) 25deg, rgba(34,211,238,0.0) 60deg)",
          }}
        />
        <div className="absolute inset-10 rounded-full border border-cyan-400/10" />
        <div className="absolute inset-24 rounded-full border border-cyan-400/10" />
        <div className="absolute inset-40 rounded-full border border-cyan-400/10" />
      </div>

      {/* Code rain animation (denser, randomized, starts mid-fall) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {rains.map((r, i) => (
          <span
            key={i}
            className={`absolute text-green-300/80 font-mono opacity-60 animate-code-rain select-none`}
            style={{
              left: r.left + "%",
              animationDelay: r.delay,
              animationDuration: r.duration,
              top: r.top,
              fontSize: r.sizeRem + "rem",
              opacity: Number(r.opacity),
            }}
          >
            {r.token}
          </span>
        ))}
      </div>

      {/* Circuit lines */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1440 900"
        aria-hidden
      >
        <defs>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.45)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.0)" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#strokeGrad)"
          strokeWidth="2"
          fill="none"
          className="animate-dash"
        >
          <path d="M100 120 L280 120 L360 200 L520 200 L600 280" />
          <path d="M220 680 L420 540 L640 540 L820 420 L1040 420" />
          <path d="M1280 200 L1080 320 L880 320 L740 460" />
          <path d="M200 320 L420 320 L520 420 L720 420" />
        </g>
        <g fill="rgba(163,230,53,0.35)">
          <circle cx="360" cy="200" r="3" />
          <circle cx="520" cy="200" r="3" />
          <circle cx="600" cy="280" r="3" />
          <circle cx="420" cy="540" r="3" />
          <circle cx="820" cy="420" r="3" />
          <circle cx="1080" cy="320" r="3" />
          <circle cx="740" cy="460" r="3" />
        </g>
      </svg>

      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-30 animate-scanline" />

      {/* Main logo and name only */}
      <div className="flex flex-col items-center gap-6 relative z-20">
        <div className="relative">
          {/* Circular progress ring wrapper */}
          <div className="relative w-[180px] h-[180px] flex items-center justify-center">
            {/* Progress ring */}
            {(() => {
              const R = 80; // radius
              const C = 2 * Math.PI * R;
              const offset = C * (1 - Math.min(1, Math.max(0, progress)));
              return (
                <svg
                  width={180}
                  height={180}
                  className="absolute inset-0"
                  viewBox="0 0 180 180"
                  aria-hidden
                >
                  {/* Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={R}
                    stroke="rgba(34,211,238,0.15)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress */}
                  <circle
                    cx="90"
                    cy="90"
                    r={R}
                    stroke="url(#grad)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 120ms ease-out" }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a3e635" />
                    </linearGradient>
                  </defs>
                </svg>
              );
            })()}
            {/* Logo glow */}
            <div className="absolute -inset-2 rounded-full bg-cyan-400/20 blur-xl" />
            <div className="relative w-36 h-36 rounded-full bg-white/95 flex items-center justify-center shadow-2xl border-4 border-cyan-300/40 animate-neon-pulse">
              <img
                src="/icon.png"
                alt="Labverse Logo"
                className="w-24 h-24 drop-shadow-xl"
                onLoad={() => setImgReady(true)}
                loading="eager"
                decoding="async"
                style={{
                  opacity: imgReady ? 1 : 0,
                  transition: "opacity 200ms ease-out",
                }}
              />
              {/* Multiple orbiting dots with random radii/speed/phase */}
              {orbitDots.map((d, idx) => (
                <span
                  key={idx}
                  className={`absolute rounded-full shadow-lg bg-gradient-to-br ${d.colorClass} ${d.radiusClass} ${d.blur}`}
                  style={{
                    left: d.left,
                    top: d.top,
                    width: d.size + "px",
                    height: d.size + "px",
                    animationDelay: d.delay,
                    animationDuration: d.duration,
                    opacity: Number(d.opacity),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {fontReady && (
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-[0.2em] bg-gradient-to-r from-white via-cyan-200 to-lime-200 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(34,211,238,0.25)] animate-fade-in">
            Labverse
          </h1>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
