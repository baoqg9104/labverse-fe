import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { handleAxiosError } from "../utils/handleAxiosError";
import { ROLE } from "../components/profile/RoleUtils";
import Modal from "../components/Modal";
import BadgeList from "../components/BadgeList";
import Avatar from "../components/Avatar";
import type { Badge } from "../types/badge";
import type { User as UserDto } from "../types/user";
import { DEFAULT_AVATAR_URL } from "../constants/config";

interface UserRow {
  id: number | string;
  username: string;
  email: string;
  role: "User" | "Author" | "Admin";
  status: "Active" | "Suspended" | "Pending";
  subscription: "Free" | "Premium";
  verified: boolean;
}

// Be permissive with API user shape; backend may return extra fields
type ApiUser = Partial<UserDto> & {
  id?: number | string;
  status?: string | number | null;
  isSuspended?: boolean;
};

function normalizeRoleLabel(val: unknown): UserRow["role"] {
  // Accept 0/1/2, "0"/"1"/"2", or labels
  if (val === ROLE.USER || val === 0 || val === "0" || val === "user")
    return "User";
  if (val === ROLE.AUTHOR || val === 1 || val === "1" || val === "author")
    return "Author";
  if (val === ROLE.ADMIN || val === 2 || val === "2" || val === "admin")
    return "Admin";
  // Fallback
  if (typeof val === "number") {
    const n = Math.trunc(val);
    if (n === 1) return "Author";
    if (n === 2) return "Admin";
  }
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s.includes("author")) return "Author";
    if (s.includes("admin")) return "Admin";
  }
  return "User";
}

function normalizeStatus(u: ApiUser): UserRow["status"] {
  // Admin view: only show Active or Suspended
  if (u.isActive === false || u.isSuspended === true) return "Suspended";
  return "Active";
}

function normalizeSubscription(val: unknown): UserRow["subscription"] {
  const s = (val ?? "").toString().trim().toLowerCase();
  return s === "premium" ? "Premium" : "Free";
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [verifiedFilter, setVerifiedFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [subFilter, setSubFilter] = useState<"all" | "free" | "premium">("all");

  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserKey, setSelectedUserKey] = useState<{
    id?: number | string;
    email?: string;
  } | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [detailsBadges, setDetailsBadges] = useState<Badge[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiUser[]>("/users", {
          params: { isOnlyVerifiedUser: false, includeInactive: true },
        });
        if (!mounted) return;
        let list = Array.isArray(res.data) ? res.data : [];

        list = list.filter((u) => u.role !== ROLE.ADMIN);

        setApiUsers(list);
      } catch (err) {
        handleAxiosError(err, {
          fallbackMessage: t("adminUsers.errors.failedLoad"),
        });
        if (mounted) setApiUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  const rows = useMemo<UserRow[]>(() => {
    return apiUsers.map((u, i) => {
      const idVal =
        (u.id as number | string | undefined) ??
        (u.email ? `#${i + 1}` : i + 1);
      const sub = normalizeSubscription(u.subscription);
      const verified = !!u.emailVerifiedAt;
      return {
        id: idVal,
        username: u.username || (u.email ? u.email.split("@")[0] : `user_${i}`),
        email: u.email || `user_${i}@mail.com`,
        role: normalizeRoleLabel(u.role),
        status: normalizeStatus(u),
        subscription: sub,
        verified,
      };
    });
  }, [apiUsers]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchesQuery =
          !query ||
          `${r.username} ${r.email}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesRole = role === "all" || r.role.toLowerCase() === role;
        const matchesStatus =
          status === "all" || r.status.toLowerCase() === status;
        const matchesVerified =
          verifiedFilter === "all" ||
          (verifiedFilter === "verified" ? r.verified : !r.verified);
        const matchesSub =
          subFilter === "all" ||
          (subFilter === "premium"
            ? r.subscription === "Premium"
            : r.subscription === "Free");
        return (
          matchesQuery &&
          matchesRole &&
          matchesStatus &&
          matchesVerified &&
          matchesSub
        );
      }),
    [rows, query, role, status, verifiedFilter, subFilter]
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getSelectedApiUser = () => {
    if (!selectedUserKey) return null;
    const { id, email } = selectedUserKey;
    let u: ApiUser | undefined;
    if (id !== undefined) {
      u = apiUsers.find((x) => x.id === id);
    }
    if (!u && email) {
      u = apiUsers.find(
        (x) => (x.email ?? "").toLowerCase() === email.toLowerCase()
      );
    }
    return u ?? null;
  };

  const onViewUser = (r: UserRow) => {
    setSelectedUserKey({ id: r.id, email: r.email });
    setDetailsOpen(true);
    // Load badges for this user lazily
    const u =
      apiUsers.find((x) => x.id === r.id) ||
      apiUsers.find(
        (x) => (x.email ?? "").toLowerCase() === r.email.toLowerCase()
      );
    if (u) void fetchUserBadges(u);
  };

  const onAskSuspend = (r: UserRow) => {
    setSelectedUserKey({ id: r.id, email: r.email });
    setConfirmOpen(true);
  };

  const onRestore = async (r: UserRow) => {
    try {
      const id = r.id;
      if (id === undefined || id === null)
        throw new Error("User id is required to restore");
      await api.post(`/users/${id}/restore`);
      // Optimistic UI: mark as active and not suspended
      setApiUsers((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, isSuspended: false, isActive: true, status: "Active" }
            : x
        )
      );
      toast.success(t("adminUsers.toasts.restored"));
    } catch (err) {
      handleAxiosError(err, {
        fallbackMessage: t("adminUsers.errors.restoreFailed"),
      });
    }
  };

  const onConfirmSuspend = async () => {
    const u = getSelectedApiUser();
    if (!u) {
      setConfirmOpen(false);
      return;
    }
    try {
      setSuspending(true);
      // Delete (soft) user as suspend: DELETE /users/{id}
      if (u.id === undefined || u.id === null)
        throw new Error("User id is required to suspend");
      await api.delete(`/users/${u.id}`);

      // Optimistically update local list to reflect suspension
      setApiUsers((prev) =>
        prev.map((x) =>
          (x.id === u.id && u.id !== undefined) ||
          ((x.email ?? "").toLowerCase() === (u.email ?? "").toLowerCase() &&
            u.email)
            ? { ...x, isSuspended: true, isActive: false, status: "Suspended" }
            : x
        )
      );
      toast.success(t("adminUsers.toasts.suspended"));
      setConfirmOpen(false);
    } catch (err) {
      handleAxiosError(err, {
        fallbackMessage: t("adminUsers.errors.suspendFailed"),
      });
    } finally {
      setSuspending(false);
    }
  };

  async function fetchUserBadges(u: ApiUser) {
    setDetailsLoading(true);
    try {
      let list: Badge[] = [];
      if (u.id !== undefined && u.id !== null) {
        try {
          const res1 = await api.get<Badge[]>(`/users/${u.id}/badges`);
          if (Array.isArray(res1.data)) list = res1.data;
        } catch {
          // fallback by userId query
          const res2 = await api.get<Badge[]>(`/badges`, {
            params: { userId: u.id },
          });
          if (Array.isArray(res2.data)) list = res2.data;
        }
      }
      setDetailsBadges(list || []);
    } catch {
      setDetailsBadges([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("adminUsers.title")}
            </h1>
            <div className="flex items-center gap-2">
              <button
                className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                onClick={() => toast.info(t("adminUsers.addUserComingSoon"))}
              >
                {t("adminUsers.addUser")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <input
              className="rounded-xl border border-gray-300 px-3 py-2"
              placeholder={t("adminUsers.searchPlaceholder")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t("adminUsers.filters.roleAll")}</option>
              <option value="user">{t("adminUsers.roles.user")}</option>
              <option value="author">{t("adminUsers.roles.author")}</option>
              <option value="admin">{t("adminUsers.roles.admin")}</option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t("adminUsers.filters.statusAll")}</option>
              <option value="active">{t("adminUsers.status.active")}</option>
              <option value="suspended">
                {t("adminUsers.status.suspended")}
              </option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(
                  e.target.value as "all" | "verified" | "unverified"
                );
                setPage(1);
              }}
            >
              <option value="all">{t("adminUsers.filters.verifiedAll")}</option>
              <option value="verified">{t("adminUsers.verified")}</option>
              <option value="unverified">{t("adminUsers.unverified")}</option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={subFilter}
              onChange={(e) => {
                setSubFilter(e.target.value as "all" | "free" | "premium");
                setPage(1);
              }}
            >
              <option value="all">{t("adminUsers.filters.subAll")}</option>
              <option value="free">{t("adminUsers.subscription.free")}</option>
              <option value="premium">
                {t("adminUsers.subscription.premium")}
              </option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>
                {t("adminUsers.pagination.pages", { count: 10 })}
              </option>
              <option value={20}>
                {t("adminUsers.pagination.pages", { count: 20 })}
              </option>
              <option value={50}>
                {t("adminUsers.pagination.pages", { count: 50 })}
              </option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            {loading ? (
              <div className="p-6 text-gray-600">{t("adminUsers.loading")}</div>
            ) : (
              <>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-4 py-3 w-56">
                        {t("adminUsers.table.email")}
                      </th>
                      <th className="px-4 py-3 w-48">
                        {t("adminUsers.table.username")}
                      </th>
                      <th className="px-4 py-3 w-36">
                        {t("adminUsers.table.role")}
                      </th>
                      <th className="px-4 py-3 w-36">
                        {t("adminUsers.table.status")}
                      </th>
                      <th className="px-4 py-3 w-28">
                        {t("adminUsers.table.verified")}
                      </th>
                      <th className="px-4 py-3 w-36">
                        {t("adminUsers.table.subscription")}
                      </th>
                      <th className="px-4 py-3 w-40">
                        {t("adminUsers.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-600"
                        >
                          {t("adminUsers.noUsers")}
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-4 py-3 text-gray-700 w-56">
                            <span
                              className="block max-w-[220px] truncate"
                              title={r.email}
                            >
                              {r.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            <span
                              className="block max-w-[200px] truncate"
                              title={r.username}
                            >
                              {r.username}
                            </span>
                          </td>
                          <td className="px-4 py-3 w-36 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs ${rolePillClass(
                                r.role
                              )} whitespace-nowrap`}
                            >
                              {t(`adminUsers.roles.${r.role.toLowerCase()}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 w-36 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs ${
                                r.status === "Active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : r.status === "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              } whitespace-nowrap`}
                            >
                              {t(`adminUsers.status.${r.status.toLowerCase()}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 w-28 text-center">
                            {r.verified ? (
                              <span
                                className="inline-flex items-center gap-2"
                                title={t("adminUsers.verified")}
                                aria-label={t("adminUsers.verified")}
                              >
                                <svg
                                  className="w-4 h-4 text-emerald-600"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="currentColor"
                                  />
                                  <path
                                    d="M7 12.5l2.5 2.5L17 8"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="sr-only">
                                  {t("adminUsers.verified")}
                                </span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-2"
                                title={t("adminUsers.unverified")}
                                aria-label={t("adminUsers.unverified")}
                              >
                                <span
                                  className="w-3 h-3 rounded-full bg-gray-300 inline-block"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  {t("adminUsers.unverified")}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 w-36 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs ${
                                r.subscription === "Premium"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-50 text-gray-700 border border-gray-200"
                              } whitespace-nowrap`}
                              title={t(
                                `adminUsers.subscription.${r.subscription.toLowerCase()}`
                              )}
                            >
                              {t(
                                `adminUsers.subscription.${r.subscription.toLowerCase()}`
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm w-40 whitespace-nowrap">
                            <button
                              className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mr-2"
                              onClick={() => onViewUser(r)}
                            >
                              {t("adminUsers.actions.view")}
                            </button>
                            {r.status === "Suspended" ? (
                              <button
                                className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => onRestore(r)}
                              >
                                {t("adminUsers.actions.restore")}
                              </button>
                            ) : (
                              <button
                                className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => onAskSuspend(r)}
                              >
                                {t("adminUsers.actions.suspend")}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end items-center gap-2 p-3">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="px-3 py-1 rounded bg-gray-100"
                  >
                    {t("adminUsers.pagination.first")}
                  </button>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 rounded bg-gray-100"
                  >
                    {t("adminUsers.pagination.prev")}
                  </button>
                  <span className="text-sm">
                    {t("adminUsers.pagination.page", {
                      page,
                      total: totalPages,
                    })}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 rounded bg-gray-100"
                  >
                    {t("adminUsers.pagination.next")}
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="px-3 py-1 rounded bg-gray-100"
                  >
                    {t("adminUsers.pagination.last")}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* View details modal */}
          <Modal
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            title={`${t("adminUsers.modal.userDetails")}`}
          >
            {(() => {
              const u = getSelectedApiUser();
              if (!u)
                return (
                  <div className="text-gray-600">
                    {t("adminUsers.noUserSelected")}
                  </div>
                );
              const roleLabel = normalizeRoleLabel(u.role);
              const statusLabel = normalizeStatus(u);
              const subLabel = normalizeSubscription(u.subscription);
              return (
                <div className="min-w-[320px] max-w-[560px]">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar
                      src={u.avatarUrl ?? undefined}
                      fallback={DEFAULT_AVATAR_URL}
                      alt={t("adminUsers.avatarAlt")}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {u.username ?? (u.email ? u.email.split("@")[0] : "—")}
                      </div>
                      <div className="text-gray-600">{u.email ?? "—"}</div>
                    </div>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${rolePillClass(
                        roleLabel
                      )}`}
                    >
                      {t(`adminUsers.roles.${roleLabel.toLowerCase()}`)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        statusLabel === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t(`adminUsers.status.${statusLabel.toLowerCase()}`)}
                    </span>
                    {u.emailVerifiedAt ? (
                      <span className="px-2 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t("adminUsers.verified")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-xs bg-gray-50 text-gray-700 border border-gray-200">
                        {t("adminUsers.unverified")}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        subLabel === "Premium"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {t(`adminUsers.subscription.${subLabel.toLowerCase()}`)}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-700">
                      {t("adminUsers.joined", {
                        date: formatDate(u.createdAt),
                      })}
                    </span>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">
                        {t("adminUsers.stats.points")}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {u.points ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">
                        {t("adminUsers.stats.level")}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {u.level ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">
                        {t("adminUsers.stats.streakCurrent")}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {u.streakCurrent ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">
                        {t("adminUsers.stats.streakBest")}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {u.streakBest ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {u.bio && (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm">
                      {u.bio}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span>🏆</span> {t("adminUsers.modal.badges")}
                    </div>
                    {detailsLoading ? (
                      <div className="text-gray-600">
                        {t("adminUsers.modal.loadingBadges")}
                      </div>
                    ) : (
                      <BadgeList badges={detailsBadges} />
                    )}
                  </div>
                </div>
              );
            })()}
          </Modal>

          {/* Confirm suspend modal */}
          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title={t("adminUsers.modal.suspendTitle")}
          >
            {(() => {
              const u = getSelectedApiUser();
              const email = u?.email ?? "this user";
              return (
                <div>
                  <p className="text-gray-700 mb-4">
                    {t("adminUsers.modal.suspendConfirm", { email })}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                      onClick={() => setConfirmOpen(false)}
                      disabled={suspending}
                    >
                      {t("adminUsers.modal.cancel")}
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 cursor-pointer disabled:opacity-70"
                      onClick={onConfirmSuspend}
                      disabled={suspending}
                    >
                      {suspending
                        ? t("adminUsers.modal.suspending")
                        : t("adminUsers.modal.suspend")}
                    </button>
                  </div>
                </div>
              );
            })()}
          </Modal>
        </div>
      </div>
    </div>
  );
}

function rolePillClass(role: UserRow["role"]) {
  switch (role) {
    case "Admin":
      return "bg-rose-100 text-rose-700";
    case "Author":
      return "bg-indigo-100 text-indigo-700";
    case "User":
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
