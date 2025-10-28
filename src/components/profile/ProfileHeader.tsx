import { DEFAULT_AVATAR_URL } from "../../constants/config";
import type { User } from "../../types/user";
import Avatar from "../Avatar";
import { getRoleMeta } from "./RoleUtils";
import { useTranslation } from "react-i18next";

type Props = {
  profile: User | null;
  plan: string;
  isMyProfile: boolean;
  onEdit: () => void;
  onViewBadges: () => void;
  onBackToMe: () => void;
};

export function ProfileHeader({
  profile,
  plan,
  isMyProfile,
  onEdit,
  onViewBadges,
  onBackToMe,
}: Props) {
  const roleMeta = getRoleMeta(profile?.role);
  const isUserRole = roleMeta.name === "USER";
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-8 text-slate-900 shadow-[0_35px_80px_-40px_rgba(14,98,255,0.25)]">
      <div className="pointer-events-none absolute -top-28 right-6 h-64 w-64 rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(77,128,255,0.08),_transparent_60%)]" />

      {!isMyProfile && (
        <button
          className="cursor-pointer absolute right-6 top-6 z-20 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          onClick={onBackToMe}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t("profile.actions.backToMe", "Back to My Profile")}
        </button>
      )}

      <div className="relative flex flex-col items-center gap-10 md:flex-row md:items-center">
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="absolute inset-0 h-full w-full rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative">
            <div className="absolute inset-0 rounded-full border border-white/70" />
            <Avatar
              src={profile?.avatarUrl || undefined}
              fallback={DEFAULT_AVATAR_URL}
              alt={t("profile.header.avatarAlt", "Avatar")}
              className="relative h-40 w-40 rounded-full border-4 border-white object-cover shadow-[0_25px_45px_-20px_rgba(38,143,255,0.5)] transition-transform duration-300 hover:scale-[1.02]"
            />
            {isUserRole && plan === "Premium" && (
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm font-semibold text-white shadow-lg">
                ✨
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                <span className="bg-gradient-to-r from-slate-900 via-sky-700 to-indigo-600 bg-clip-text text-transparent">
                  {profile?.username ||
                    t("profile.header.unknown", "Unknown user")}
                </span>
              </h1>
              <p className="text-sm text-slate-600 md:text-base">
                {profile?.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              {isUserRole && (
                <span
                  className={`inline-flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition ${
                    plan === "Premium"
                      ? "bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 text-slate-800 shadow"
                      : "bg-white shadow"
                  }`}
                >
                  {plan === "Premium" && <span>👑</span>}
                  {t(`profile.plan.${String(plan).toLowerCase()}`, plan)}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-800 backdrop-blur ${roleMeta.badgeClass}`}
                title={`${t("profile.header.rolePrefix", "Role")}: ${t(
                  `profile.roles.${roleMeta.name.toLowerCase()}`,
                  roleMeta.label
                )}`}
              >
                {roleMeta.name === "ADMIN" && <span>🛡️</span>}
                {roleMeta.name === "AUTHOR" && <span>✍️</span>}
                {t(
                  `profile.roles.${roleMeta.name.toLowerCase()}`,
                  roleMeta.label
                )}
              </span>
            </div>
          </div>

          {profile?.bio && (
            <p className="mx-auto max-w-2xl text-sm text-slate-600 md:mx-0 md:text-base">
              {profile.bio}
            </p>
          )}

          {isMyProfile && (
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <button
                className="cursor-pointer group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-slate-700 transition hover:-translate-y-0.5 hover:shadow"
                onClick={onEdit}
              >
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {t("profile.actions.editProfile", "Edit Profile")}
              </button>
              <button
                className="cursor-pointer group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_25px_45px_-25px_rgba(56,231,173,0.5)]"
                onClick={onViewBadges}
              >
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                {t("profile.actions.viewBadges", "View Badges")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
