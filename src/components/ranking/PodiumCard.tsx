import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Criteria, RankingItem } from "./RankingTypes";
import { DEFAULT_AVATAR_URL } from "../../constants/config";
import { getCriteriaValue, funAchievement, medalSrcByRank } from "./helpers";

export default function PodiumCard({
  item,
  rank,
  criteria,
  className,
  tall,
  onClick,
}: {
  item: RankingItem;
  rank: 1 | 2 | 3;
  criteria: Criteria;
  className?: string;
  tall?: boolean;
  onClick?: () => void;
}) {
  const avatarSrc = (item.avatarUrl && item.avatarUrl.trim().length > 0 ? item.avatarUrl : DEFAULT_AVATAR_URL) as string;
  const value = getCriteriaValue(item, criteria);
  const ring = rank === 1 ? "ring-4 ring-amber-400" : rank === 2 ? "ring-4 ring-gray-400" : "ring-4 ring-orange-400";
  const medalImg = medalSrcByRank(rank);
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, delay: rank * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={["group cursor-pointer flex flex-col items-center text-center bg-white rounded-2xl px-4 py-3 shadow hover:shadow-md transition-shadow", className].join(" ")}
    >
      <div className={["relative", tall ? "mb-3" : "mb-2"].join(" ")}>
        <img src={avatarSrc} alt="avatar" className={["rounded-full object-cover bg-gray-100 border size-24 md:size-28 transition-transform", ring, "group-hover:scale-105"].join(" ")} />
        <img src={medalImg} alt={`Rank ${rank} medal`} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-2 py-1 text-xs rounded bg-black/70 text-white shadow">{funAchievement(criteria, item)}</div>
        </div>
      </div>
      <div className="font-semibold text-gray-900">{item.username}</div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
        <span className="font-semibold">{value}</span>
        <span className="opacity-90">{t(`ranking.criteria.${criteria}`)}</span>
      </div>
    </motion.div>
  );
}
