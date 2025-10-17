import { useMemo } from "react";

export function TimerBar({
  remaining,
  total,
  state = "running",
}: {
  remaining: number;
  total: number;
  state?: "running" | "paused" | "stopped";
}) {
  const pct = useMemo(() => {
    const p = Math.max(0, Math.min(1, remaining / Math.max(1, total)));
    return p * 100;
  }, [remaining, total]);

  const isWarning = remaining <= 5;
  const barColor = isWarning
    ? "from-red-500 to-orange-400"
    : "from-blue-600 to-cyan-500";
  const opacity = state === "stopped" ? "opacity-40" : state === "paused" ? "opacity-70" : "opacity-100";

  return (
    <div
      className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden"
      aria-label="timer"
      aria-valuenow={remaining}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className={[
          "h-full transition-[width] duration-300 ease-out",
          "bg-gradient-to-r",
          barColor,
          opacity,
        ].join(" ")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
