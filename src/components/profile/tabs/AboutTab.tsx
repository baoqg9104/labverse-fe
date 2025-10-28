import type { User } from "../../../types/user";
import { useTranslation } from "react-i18next";

export function AboutTab({ profile }: { profile: User | null }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          {t('profile.about.title')}
        </h3>
        <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
          {profile?.bio || t('profile.about.noBio')}
        </div>
      </div>
    </div>
  );
}

export default AboutTab;
