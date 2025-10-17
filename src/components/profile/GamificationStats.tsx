import CircularProgress from "@mui/material/CircularProgress";

interface Props {
  points: number | undefined;
  level: number | undefined;
  streakCurrent: number | undefined;
  streakBest: number | undefined;
}

// Backend formula (triangular progression):
// Total XP to reach level N: BaseXp * ((N-1) * N / 2)
const BASE_XP = 100;

function totalXpToReachLevel(n: number): number {
  const N = Math.max(1, Math.floor(n));
  return Math.floor((BASE_XP * (N - 1) * N) / 2);
}

function deriveLevelFromPoints(points: number): number {
  const x = Math.max(0, points) / BASE_XP;
  // Solve (N-1)*N/2 <= x  => N = floor((1 + sqrt(1 + 8x)) / 2)
  const N = Math.floor((1 + Math.sqrt(1 + 8 * x)) / 2);
  return Math.max(1, N);
}

function getLevelProgress(points: number) {
  const lvl = deriveLevelFromPoints(points);
  const min = totalXpToReachLevel(lvl);
  const next = totalXpToReachLevel(lvl + 1);
  const span = Math.max(1, next - min);
  const clamped = Math.max(min, Math.min(points, next));
  const progress = (clamped - min) / span;
  return { level: lvl, min, next, progress: Math.max(0, Math.min(progress, 1)) };
}

export default function GamificationStats({ points, level, streakCurrent, streakBest }: Props) {
  const p = Math.max(0, points ?? 0);
  const derived = getLevelProgress(p);
  const lvl = derived.level || Math.max(1, level ?? 1);
  const pct = Math.round(derived.progress * 100);
  const next = derived.next;
  const remaining = Math.max(0, next - p);

  return (
    <div className="w-full bg-gradient-to-r from-sky-50 to-indigo-50 pt-8">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex flex-wrap justify-center items-stretch gap-6">
          {/* Points */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-sky-100 flex flex-col items-center justify-center min-w-[200px] flex-1" style={{ height: 220 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl">🏆</div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{p.toLocaleString()}</div>
            <div className="text-gray-600 font-medium">Points</div>
            <div className="text-xs text-gray-500 mt-2 text-center">Earn XP by learning and contributing</div>
          </div>

          {/* Level with progress */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-indigo-100 flex flex-col items-center justify-center min-w-[220px] flex-1" style={{ height: 220 }}>
            <div className="relative mb-2" style={{ width: 92, height: 92 }}>
              <CircularProgress variant="determinate" value={100} size={92} thickness={4} sx={{ color: "#E5E7EB" }} />
              <CircularProgress variant="determinate" value={pct} size={92} thickness={4} sx={{ position: "absolute", left: 0, top: 0 }} />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-800">Lv {lvl}</div>
            </div>
            <div className="text-gray-600 font-medium">Level</div>
            <div className="text-xs text-gray-500 mt-1">Next at {next.toLocaleString()} XP • {remaining.toLocaleString()} XP to go</div>
          </div>

          {/* Streak */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-amber-100 flex flex-col items-center justify-center min-w-[220px] flex-1" style={{ height: 220 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">🔥</div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{Math.max(0, streakCurrent ?? 0)}</div>
            <div className="text-gray-600 font-medium">Current Streak (days)</div>
            <div className="text-sm text-amber-700 mt-2">Best: {Math.max(0, streakBest ?? 0)} days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
