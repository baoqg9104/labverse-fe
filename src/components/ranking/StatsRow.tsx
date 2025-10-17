import { useTranslation } from "react-i18next";
import type { Criteria, RankingItem } from "./RankingTypes";

export default function StatsRow({ item, criteria }: { item: RankingItem; criteria: Criteria }) {
  const { t } = useTranslation();
  const isPoints = criteria === "points";
  const isStreak = criteria === "streak";
  const isBadges = criteria === "badges";
  return (
    <div className="ml-auto flex items-center gap-6 text-sm">
      <div className={["text-gray-700", isPoints ? "bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full" : ""].join(" ")}>
        <span className="font-semibold">{item.points}</span> {t("ranking.units.points")}
      </div>
      <div className={["text-gray-700", isStreak ? "bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full" : ""].join(" ")}>
        <span className="font-semibold">{item.streakCurrent}</span> {t("ranking.units.streak")}
      </div>
      <div className={["text-gray-700", isBadges ? "bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full" : ""].join(" ")}>
        <span className="font-semibold">{item.badgesCount}</span> {t("ranking.units.badges")}
      </div>
    </div>
  );
}
