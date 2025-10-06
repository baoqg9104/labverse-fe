import { useEffect, useState } from "react";
import type { Badge } from "../../types/badge";
import { ROLE } from "./RoleUtils";
import api from "../../utils/axiosInstance";

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

  return (
    <div className="w-full bg-gradient-to-r from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex flex-wrap justify-center items-center gap-6">
          {/* Primary metric: User -> Labs Completed; Author -> Labs Written; Admin -> hidden */}
          {role !== ROLE.ADMIN && (
            <div
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-100 flex flex-col items-center justify-center min-w-[220px] flex-1"
              style={{ height: "220px" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {role === ROLE.AUTHOR
                  ? labsWritten
                  : loadingCompleted
                  ? "…"
                  : (completedCount ?? 0)}
              </div>
              <div className="text-gray-600 font-medium">
                {role === ROLE.AUTHOR ? "Labs Written" : "Labs Completed"}
              </div>
            </div>
          )}

          {/* Joined date card (shown for all roles) */}
          <div
            className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-100 flex flex-col items-center justify-center min-w-[220px] flex-1"
            style={{ height: "220px", maxWidth: "320px" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {joinedAt ? new Date(joinedAt).toISOString().slice(0, 10) : "—"}
            </div>
            <div className="text-gray-600 font-medium">Joined</div>
          </div>

          {/* Badges card (hidden for admin) */}
          {role !== ROLE.ADMIN && (
            <div
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-emerald-100 cursor-pointer flex flex-col items-center justify-center min-w-[220px] flex-1"
              style={{ height: "220px" }}
              onClick={onViewBadges}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {badges.length}
              </div>
              <div className="text-gray-600 font-medium">Badges Earned</div>
              <div className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <span>View collection</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
