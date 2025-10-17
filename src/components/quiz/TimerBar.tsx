import { useEffect, useMemo, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";

export function TimerBar({
  remaining,
  total,
  state = "running",
}: {
  remaining: number;
  total: number;
  state?: "running" | "paused" | "stopped";
}) {
  const controls = useAnimationControls();
  const lastRemainingRef = useRef<number>(remaining);
  const lastStateRef = useRef<typeof state>(state);
  const mountedRef = useRef(false);

  const pct = useMemo(() => {
    const p = Math.max(0, Math.min(1, remaining / Math.max(1, total)));
    return p * 100;
  }, [remaining, total]);

  useEffect(() => {
    const justMounted = !mountedRef.current;
    if (state === "running") {
      const resetOrResume =
        justMounted ||
        lastStateRef.current !== "running" ||
        remaining > lastRemainingRef.current + 0.001;
      if (resetOrResume) {
        // Snap to current width then animate linearly to 0 over `remaining` seconds
        controls.set({ width: `${pct}%` });
        controls.start({
          width: "0%",
          transition: { duration: Math.max(0, remaining), ease: "linear" },
        });
      }
    } else if (state === "paused") {
      controls.stop();
    } else {
      // stopped
      controls.stop();
      controls.set({ width: "0%" });
    }
    mountedRef.current = true;
    lastStateRef.current = state;
    lastRemainingRef.current = remaining;
  }, [controls, pct, remaining, state]);

  const isWarning = remaining <= 5;
  const barColor = isWarning
    ? "from-red-500 to-orange-400"
    : "from-blue-600 to-cyan-500";
  const opacity =
    state === "stopped"
      ? "opacity-40"
      : state === "paused"
      ? "opacity-70"
      : "opacity-100";

  return (
    <div
      className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden"
      aria-label="timer"
      aria-valuenow={Math.ceil(remaining)}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <motion.div
        className={[
          "h-full will-change-[width]",
          "bg-gradient-to-r",
          barColor,
          opacity,
        ].join(" ")}
        style={{ width: `${pct}%` }}
        animate={controls}
      />
    </div>
  );
}
