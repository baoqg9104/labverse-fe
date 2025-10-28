import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Criteria, RankingItem } from "./RankingTypes";
import { DEFAULT_AVATAR_URL } from "../../constants/config";
import Avatar from "../Avatar";

function StatTile({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl p-3 text-center border",
        highlight ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200",
      ].join(" ")}
    >
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 inline-flex items-center gap-1">
        <span aria-hidden>{icon}</span>
        {value}
      </div>
    </div>
  );
}

export default function UserModal({
  user,
  onClose,
  criteria,
}: {
  user: RankingItem | null;
  onClose: () => void;
  criteria: Criteria;
}) {
  const { t } = useTranslation();
  if (!user) return null;
  const avatarSrc = (
    user.avatarUrl && user.avatarUrl.trim().length > 0
      ? user.avatarUrl
      : DEFAULT_AVATAR_URL
  ) as string;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
          >
            ✖
          </button>
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={avatarSrc || undefined}
              fallback={DEFAULT_AVATAR_URL}
              alt="avatar"
              className="size-16 rounded-full object-cover border"
            />
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {user.username}
              </div>
              <div className="text-xs text-gray-500">
                {t("ranking.id")}: {user.userId}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label={t("ranking.criteria.points")}
              value={user.points}
              icon="💯"
              highlight={criteria === "points"}
            />
            <StatTile
              label={t("ranking.criteria.streak")}
              value={user.streakCurrent}
              icon="🔥"
              highlight={criteria === "streak"}
            />
            <StatTile
              label={t("ranking.criteria.badges")}
              value={user.badgesCount}
              icon="⭐"
              highlight={criteria === "badges"}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
