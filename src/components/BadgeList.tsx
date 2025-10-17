import type { Badge } from "../types/badge";
import { FaMedal } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface BadgeListProps {
  badges: Badge[];
}

const palettes = [
  {
    accent: "from-amber-400/40 via-amber-500/20 to-transparent",
    icon: "text-amber-200",
  },
  {
    accent: "from-sky-400/40 via-blue-500/20 to-transparent",
    icon: "text-sky-200",
  },
  {
    accent: "from-emerald-400/40 via-emerald-500/20 to-transparent",
    icon: "text-emerald-200",
  },
  {
    accent: "from-fuchsia-400/40 via-purple-500/20 to-transparent",
    icon: "text-fuchsia-200",
  },
  {
    accent: "from-rose-400/40 via-pink-500/20 to-transparent",
    icon: "text-rose-200",
  },
];

export default function BadgeList({ badges }: BadgeListProps) {
  const { t } = useTranslation();

  if (!badges.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm backdrop-blur">
        {t(
          "profile.badges.empty",
          "No badges yet. Start completing labs to earn your first badge!"
        )}
      </div>
    );
  }

  return (
    <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {badges.map((badge, idx) => {
        const palette = palettes[idx % palettes.length];
        return (
          <div
            key={badge.name}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-slate-100 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_20px_45px_-15px_rgba(76,132,255,0.45)]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative flex flex-col items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <FaMedal className={`h-12 w-12 ${palette.icon}`} />
                )}
              </div>
              <div className="space-y-1">
                <div className="truncate text-sm font-semibold uppercase tracking-wide">
                  {badge.name}
                </div>
                <div className="text-xs text-slate-300/90">{badge.desc}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
