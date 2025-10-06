import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { DEFAULT_AVATAR_URL } from "../constants/config";
import { LanguageDropdown } from "../components/LanguageDropdown";
import { getRoleMeta } from "../components/profile/RoleUtils";

export const Account = () => {
  const { user, isAuthLoading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const plan = useMemo(
    () => (user?.subscription || "Free").trim(),
    [user?.subscription]
  );
  const isPremium = useMemo(
    () => plan.toLowerCase().includes("premium"),
    [plan]
  );
  const createdDate = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, [user?.createdAt]);

  const onManageSubscription = () => navigate("/pricing");
  const onGoProfile = () => navigate("/profile");
  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fb] via-[#ecf0fe] to-[#e3c6e6] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1a144b] to-[#6a5acd]">
            Your Account
          </h1>
          <div className="hidden sm:block">
            <LanguageDropdown />
          </div>
        </div>

        {/* Content Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile summary */}
          <section className="lg:col-span-1 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            {isAuthLoading ? (
              <div className="animate-pulse">
                <div className="w-28 h-28 rounded-full bg-gray-200 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mt-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mt-2" />
                <div className="h-6 bg-gray-200 rounded w-24 mx-auto mt-4" />
              </div>
            ) : (
              <>
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={user?.avatarUrl || DEFAULT_AVATAR_URL}
                      alt="avatar"
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-[#b6ff3c] shadow"
                    />
                    {/* <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5h0" />
                        <path d="M20.4 14.5L19 20l-5.5 1.4a2 2 0 0 1-2.4-1.4L4 6a2 2 0 0 1 1.4-2.4L11 2.1a2 2 0 0 1 2.4 1.4L15 6l5.4 8.5Z" />
                      </svg>
                    </div> */}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xl font-bold text-[#1a144b]">
                      {user?.username || "User"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user?.email || "—"}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        isPremium
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {isPremium && <span>👑</span>}
                      {plan}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    className="cursor-pointer w-full px-4 py-2 rounded-xl bg-[#221d4f] text-white font-semibold shadow hover:bg-[#2c2565]"
                    onClick={onGoProfile}
                  >
                    View Profile
                  </button>
                  <button
                    className="cursor-pointer w-full px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-50"
                    onClick={onManageSubscription}
                  >
                    {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
                  </button>
                  <button
                    className="cursor-pointer w-full px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100"
                    onClick={onLogout}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Right: Details & settings */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a144b]">
                Account Details
              </h2>
              {isAuthLoading ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  <div className="h-16 rounded-xl bg-gray-100" />
                  <div className="h-16 rounded-xl bg-gray-100" />
                  <div className="h-16 rounded-xl bg-gray-100" />
                  <div className="h-16 rounded-xl bg-gray-100" />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <span className="text-gray-500">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 4h16v16H4z" />
                        <path d="M22 6l-10 7L2 6" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-medium">{user?.email || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <span className="text-gray-500">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs text-gray-500">Username</div>
                      <div className="font-medium">{user?.username || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <span className="text-gray-500">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
                        <circle cx="12" cy="7" r="4" />
                        <path d="M17 11h4v4" />
                        <path d="M21 11l-4 4" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs text-gray-500">Role</div>
                      <div className="font-medium">
                        {getRoleMeta(user?.role).label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <span className="text-gray-500">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 7V3h8v4" />
                        <rect x="4" y="7" width="16" height="13" rx="2" />
                        <path d="M8 11h8" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs text-gray-500">Member Since</div>
                      <div className="font-medium">{createdDate || "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a144b]">Bio</h2>
              {isAuthLoading ? (
                <div className="mt-3 h-20 rounded-xl bg-gray-100 animate-pulse" />
              ) : (
                <p className="mt-3 text-gray-700 min-h-[80px]">
                  {user?.bio?.trim() || (
                    <span className="text-gray-400">No bio yet.</span>
                  )}
                </p>
              )}
            </div>

            {!isPremium && !isAuthLoading && (
              <div className="rounded-3xl p-6 border-2 border-[#b6aaff] bg-gradient-to-r from-[#f7f4ff] to-[#f0f7ff] flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-[#1a144b]">
                    Unlock Premium
                  </div>
                  <div className="text-gray-600">
                    Get unlimited lab access, downloads and priority support.
                  </div>
                </div>
                <button
                  className="cursor-pointer px-5 py-2 rounded-xl bg-[#b6ff3c] text-[#201958] font-bold shadow hover:bg-[#a0e636]"
                  onClick={onManageSubscription}
                >
                  Upgrade now
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
