import { DEFAULT_AVATAR_URL } from "../../constants/config";
import type { User } from "../../types/user";
import { getRoleMeta } from "./RoleUtils";

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
  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8">
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Avatar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
          <img
            src={profile?.avatarUrl || DEFAULT_AVATAR_URL}
            alt="avatar"
            className="relative w-40 h-40 rounded-full object-cover border-4 transition-all duration-300 group-hover:scale-105 border-white shadow-white/50 shadow-2xl"
          />
          {isUserRole && plan === "Premium" && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
              ✨
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {profile?.username}
            </h1>
            {isUserRole && (
              <span
                className={`inline-flex items-center px-4 py-1 rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
                  plan === "Premium"
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-400/50"
                    : "bg-white/20 text-white border border-white/30"
                }`}
              >
                {plan === "Premium" && <span className="mr-1">👑</span>}
                {plan}
              </span>
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full font-semibold shadow-lg transition-all duration-300 ${roleMeta.badgeClass}`}
              title={`Role: ${roleMeta.label}`}
            >
              {roleMeta.name === "ADMIN" && <span className="mr-1">🛡️</span>}
              {roleMeta.name === "AUTHOR" && <span className="mr-1">✍️</span>}
              {roleMeta.label}
            </span>
          </div>

          <p className="text-blue-100 text-lg mb-6">{profile?.email}</p>

          {isMyProfile && (
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                className="cursor-pointer group flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-white/20"
                onClick={onEdit}
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:rotate-12"
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
                Edit Profile
              </button>
              <button
                className="cursor-pointer group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={onViewBadges}
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:scale-110"
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
                View Badges
              </button>
            </div>
          )}
        </div>

        {!isMyProfile && (
          <button
            className="cursor-pointer absolute top-6 right-6 group flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20 z-20"
            onClick={onBackToMe}
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
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
            Back to My Profile
          </button>
        )}
      </div>
    </div>
  );
}
