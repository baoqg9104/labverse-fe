import { useEffect, useMemo, useRef, useState } from "react";
import award from "../assets/trophy.png";

interface Props {
  visible: boolean;
  points: number;
  message?: string;
  onClose: () => void;
}

// Full-screen overlay to announce daily login points reward
export default function DailyLoginRewardOverlay({
  visible,
  points,
  message,
  onClose,
}: Props) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Basic confetti pieces (lightweight, no external deps)
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100, // vw percent
        delay: Math.random() * 120, // ms
        duration: 1200 + Math.random() * 900, // ms
        size: 6 + Math.random() * 10,
        rotate: Math.random() * 360,
        hue: Math.floor(180 + Math.random() * 160),
      })),
    []
  );

  useEffect(() => {
    if (!visible) return;

    // Scroll lock
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // Count up animation (ease-out)
    const start = performance.now();
    const duration = 1100; // ms
    const from = 0;
    const to = Math.max(0, points);
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const val = Math.round(from + (to - from) * easeOut(p));
      setDisplayPoints(val);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [visible, points]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      // Backdrop click is disabled; use the Close button instead
    >
      {/* Confetti Layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute block origin-center"
            style={{
              left: `${c.left}vw`,
              top: `-12px`,
              width: `${c.size}px`,
              height: `${c.size * 0.5}px`,
              background: `hsl(${c.hue} 90% 60%)`,
              transform: `rotate(${c.rotate}deg)`,
              borderRadius: "1px",
              animation: `dlr-confetti ${c.duration}ms ease-out ${c.delay}ms both`,
              boxShadow: "0 0 0.5px rgba(0,0,0,0.2)",
            }}
          />
        ))}
      </div>

      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-gradient-to-br from-emerald-500/95 to-teal-600/95 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15"
        // Stop click propagation (not necessary now but kept for clarity)
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "dlr-pop 360ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 select-none text-6xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)] animate-[dlr-pulse_1600ms_ease-in-out_infinite]">
          ✨
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <span className="animate-[dlr-bounce_900ms_cubic-bezier(0.2,0.9,0.2,1)_both]">
              <img src={award} alt="Award" className="size-7" />
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              Nhận điểm đăng nhập hằng ngày
            </h3>
            <p className="text-white/90 text-sm">
              {message ?? "Bạn vừa nhận điểm vì đăng nhập hôm nay!"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <span
            className="text-5xl font-extrabold leading-none bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #fff, #e7fbd5 20%, #b1ffdb 50%, #e7fbd5 80%, #fff)",
              animation: "dlr-shimmer 1800ms linear infinite",
            }}
            aria-label={`+${points} điểm`}
          >
            +{displayPoints}
          </span>
          <span className="mb-1 text-lg font-medium opacity-90">điểm</span>
        </div>

        <button
          onClick={onClose}
          className="cursor-pointer mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Đóng
        </button>

        <style>{`
          @keyframes dlr-pop {
            0% { opacity: 0; transform: translateY(14px) scale(0.95); }
            55% { opacity: 1; transform: translateY(0) scale(1.03); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes dlr-pulse {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
            50% { transform: translateY(1px) scale(1.06); opacity: 1; }
          }
          @keyframes dlr-bounce {
            0% { transform: translateY(-6px) scale(0.98); opacity: 0; }
            50% { transform: translateY(2px) scale(1.04); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes dlr-shimmer {
            0% { background-position: -120% 0; }
            100% { background-position: 220% 0; }
          }
          @keyframes dlr-confetti {
            0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
            12% { opacity: 1; }
            100% { transform: translateY(100vh) rotate(540deg); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
