import BadgeList from "../../BadgeList";
import type { Badge } from "../../../types/badge";
import { useTranslation } from "react-i18next";

export function BadgesTab({ badges }: { badges: Badge[] }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <span className="text-2xl">🏆</span>
          {t("profile.badges.title", "Achievements & Badges")}
        </h3>
        <p className="text-gray-600">{t("profile.badges.desc", "Your collection of earned badges and achievements")}</p>
      </div>
      <BadgeList badges={badges} />
    </div>
  );
}

export default BadgesTab;
