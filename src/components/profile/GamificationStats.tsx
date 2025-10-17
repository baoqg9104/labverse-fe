import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";
import { FiStar, FiZap } from "react-icons/fi";

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
  return {
    level: lvl,
    min,
    next,
    progress: Math.max(0, Math.min(progress, 1)),
  };
}

const cardBase =
  "group relative flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

export default function GamificationStats({
  points,
  level,
  streakCurrent,
  streakBest,
}: Props) {
  const { t } = useTranslation();
  const p = Math.max(0, points ?? 0);
  const derived = getLevelProgress(p);
  const lvl = derived.level || Math.max(1, level ?? 1);
  const pct = Math.round(derived.progress * 100);
  const next = derived.next;
  const remaining = Math.max(0, next - p);

  const streakNow = Math.max(0, streakCurrent ?? 0);
  const streakBestSafe = Math.max(0, streakBest ?? 0);

  return (
    <div className="px-8 pt-6">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`${cardBase} items-start`}>
          <div className="flex w-full items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {t("profile.gamification.points", "Points")}
              </div>
              <div className="mt-4 text-3xl font-semibold text-slate-900">
                {p.toLocaleString()}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-xl">
              <FiZap className="text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {t(
              "profile.gamification.pointsHint",
              "Earn XP by completing labs, maintaining streaks, and contributing back."
            )}
          </p>
        </div>

        <div className={`${cardBase} items-center text-center`}>
          <div className="flex w-full items-start justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {t("profile.gamification.level", "Level")}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 text-xl">
              <FiStar className="text-white" />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative mb-3" style={{ width: 96, height: 96 }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={96}
                thickness={4}
                sx={{ color: "rgba(148, 163, 184, 0.25)" }}
              />
              <CircularProgress
                variant="determinate"
                value={pct}
                size={96}
                thickness={4}
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  "& .MuiCircularProgress-circle": {
                    stroke: "url(#levelGradient)",
                  },
                }}
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient
                    id="levelGradient"
                    x1="1"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6EE7FF" />
                    <stop offset="50%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#C084FC" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-900">
                Lv {lvl}
              </div>
            </div>
            <div className="text-sm text-slate-600">
              {t("profile.gamification.nextLevel", "Next level at {{xp}} XP", {
                xp: next.toLocaleString(),
              })}
            </div>
            <div className="text-xs text-slate-500">
              {t("profile.gamification.remaining", "{{xp}} XP to go", {
                xp: remaining.toLocaleString(),
              })}
            </div>
          </div>
        </div>

        <div className={`${cardBase} items-start`}>
          <div className="flex w-full items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {t("profile.gamification.streak", "Current streak")}
              </div>
              <div className="mt-4 text-3xl font-semibold text-slate-900">
                {streakNow}
                <span className="ml-2 text-sm text-slate-500">
                  {t("profile.gamification.days", "days")}
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-xl">
              🔥
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {t("profile.gamification.best", "Best streak: {{days}} days", {
              days: streakBestSafe,
            })}
          </p>
          <p className="text-xs text-slate-500">
            {t(
              "profile.gamification.streakHint",
              "Log in daily to keep the flame alive and unlock streak rewards."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
