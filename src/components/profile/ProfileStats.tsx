import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Badge } from "../../types/badge";
import api from "../../utils/axiosInstance";
import { ROLE } from "./RoleUtils";

type Props = {
  badges: Badge[];
  onViewBadges: () => void;
  role?: number;
  joinedAt?: string | null;
  labsWritten?: number;
};

export function ProfileStats({
  badges,
  onViewBadges,
  role,
  joinedAt,
  labsWritten = 0,
}: Props) {
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "vi" ? "vi-VN" : undefined;

  // Fetch completed labs (for regular users). Authors use labsWritten; Admin hides this card.
  useEffect(() => {
    if (role === ROLE.USER || role === undefined || role === null) {
      setLoadingCompleted(true);
      api
        .get<number[]>("/user-progresses/completed")
        .then((res) => {
          const arr = Array.isArray(res.data) ? res.data : [];
          setCompletedCount(arr.length);
        })
        .catch(() => {
          setCompletedCount(null);
        })
        .finally(() => setLoadingCompleted(false));
    } else {
      // Reset when not applicable
      setCompletedCount(null);
      setLoadingCompleted(false);
    }
  }, [role]);

  const formattedJoined = useMemo(() => {
    if (!joinedAt) return t("profile.info.notAvailable", "Not available");
    const date = new Date(joinedAt);
    if (Number.isNaN(date.getTime()))
      return t("profile.info.notAvailable", "Not available");
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        date
      );
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }, [joinedAt, locale, t]);

  const primaryValue = role === ROLE.AUTHOR ? labsWritten : completedCount ?? 0;

  const cards = useMemo(() => {
    const out: Array<{
      key: "labs" | "joined" | "badges";
      title: string;
      value: string | number;
      sub: string;
      gradient: string;
      onClick?: () => void;
    }> = [];

    if (role !== ROLE.ADMIN) {
      out.push({
        key: "labs",
        title:
          role === ROLE.AUTHOR
            ? t("profile.stats.labsWritten", "Labs written")
            : t("profile.stats.labsCompleted", "Labs completed"),
        value: role === ROLE.AUTHOR || !loadingCompleted ? primaryValue : "…",
        sub:
          role === ROLE.AUTHOR
            ? t(
                "profile.stats.labsWrittenHint",
                "Content published for students"
              )
            : t(
                "profile.stats.labsCompletedHint",
                "Learning progress across labs"
              ),
        gradient: "from-sky-500 via-indigo-500 to-purple-500",
      });
    }

    out.push({
      key: "joined",
      title: t("profile.stats.joined", "Joined"),
      value: formattedJoined,
      sub: t("profile.stats.joinedHint", "Part of Labverse"),
      gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    });

    if (role !== ROLE.ADMIN) {
      out.push({
        key: "badges",
        title: t("profile.stats.badges", "Badges earned"),
        value: badges.length,
        sub: t("profile.stats.badgesHint", "Tap to open collection"),
        gradient: "from-emerald-500 via-teal-500 to-green-500",
        onClick: onViewBadges,
      });
    }

    return out;
  }, [
    badges.length,
    formattedJoined,
    loadingCompleted,
    onViewBadges,
    primaryValue,
    role,
    t,
  ]);

  const handleKeyActivate = (
    evt: KeyboardEvent<HTMLDivElement>,
    action?: () => void
  ) => {
    if (!action) return;
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      action();
    }
  };

  return (
    <div className="px-8 pb-6">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className={`group relative flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-left text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              card.onClick ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={card.onClick}
            onKeyDown={(evt) => handleKeyActivate(evt, card.onClick)}
            role={card.onClick ? "button" : undefined}
            tabIndex={card.onClick ? 0 : undefined}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {card.title}
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-900">
                  {card.value}
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-xl`}
              >
                {card.key === "labs" && "📚"}
                {card.key === "joined" && "⏳"}
                {card.key === "badges" && "🏅"}
              </div>
            </div>
            <div className="text-sm text-slate-500">{card.sub}</div>
            {card.onClick && (
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-600/90 transition group-hover:text-emerald-500">
                <span>{t("profile.stats.viewAction", "Open")}</span>
                <svg
                  className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
