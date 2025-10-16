import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { handleAxiosError } from "../utils/handleAxiosError";
import { ROLE } from "../components/profile/RoleUtils";
import Modal from "../components/Modal";
import BadgeList from "../components/BadgeList";
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
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [subFilter, setSubFilter] = useState<"all" | "free" | "premium">("all");

  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserKey, setSelectedUserKey] = useState<{ id?: number | string; email?: string } | null>(null);
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
        const list = Array.isArray(res.data) ? res.data : [];
        setApiUsers(list);
      } catch (err) {
        handleAxiosError(err, { fallbackMessage: "Failed to load users" });
        if (mounted) setApiUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo<UserRow[]>(() => {
    return apiUsers.map((u, i) => {
      const idVal =
        (u.id as number | string | undefined) ?? (u.email ? `#${i + 1}` : i + 1);
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
          !query || `${r.username} ${r.email}`.toLowerCase().includes(query.toLowerCase());
        const matchesRole = role === "all" || r.role.toLowerCase() === role;
        const matchesStatus = status === "all" || r.status.toLowerCase() === status;
        const matchesVerified =
          verifiedFilter === "all" || (verifiedFilter === "verified" ? r.verified : !r.verified);
        const matchesSub =
          subFilter === "all" || (subFilter === "premium" ? r.subscription === "Premium" : r.subscription === "Free");
        return matchesQuery && matchesRole && matchesStatus && matchesVerified && matchesSub;
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
      u = apiUsers.find((x) => (x.email ?? "").toLowerCase() === email.toLowerCase());
    }
    return u ?? null;
  };

  const onViewUser = (r: UserRow) => {
    setSelectedUserKey({ id: r.id, email: r.email });
    setDetailsOpen(true);
    // Load badges for this user lazily
    const u = apiUsers.find((x) => x.id === r.id) || apiUsers.find((x) => (x.email ?? "").toLowerCase() === r.email.toLowerCase());
    if (u) void fetchUserBadges(u);
  };

  const onAskSuspend = (r: UserRow) => {
    setSelectedUserKey({ id: r.id, email: r.email });
    setConfirmOpen(true);
  };

  const onRestore = async (r: UserRow) => {
    try {
      const id = r.id;
      if (id === undefined || id === null) throw new Error("User id is required to restore");
      await api.post(`/users/${id}/restore`);
      // Optimistic UI: mark as active and not suspended
      setApiUsers((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isSuspended: false, isActive: true, status: "Active" } : x))
      );
      toast.success("User restored");
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: "Failed to restore user" });
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
      if (u.id === undefined || u.id === null) throw new Error("User id is required to suspend");
      await api.delete(`/users/${u.id}`);

      // Optimistically update local list to reflect suspension
      setApiUsers((prev) =>
        prev.map((x) =>
          (x.id === u.id && u.id !== undefined) ||
          ((x.email ?? "").toLowerCase() === (u.email ?? "").toLowerCase() && u.email)
            ? { ...x, isSuspended: true, isActive: false, status: "Suspended" }
            : x
        )
      );
      toast.success("User suspended");
      setConfirmOpen(false);
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: "Failed to suspend user" });
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
          const res2 = await api.get<Badge[]>(`/badges`, { params: { userId: u.id } });
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Users</h1>
            <div className="flex items-center gap-2">
              <button
                className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                onClick={() => toast.info("Add User: coming soon")}
              >
                Add User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search name or email" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={role} onChange={(e)=>{ setRole(e.target.value); setPage(1);} }>
              <option value="all">Role: All</option>
              <option value="user">User</option>
              <option value="author">Author</option>
              <option value="admin">Admin</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1);} }>
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={verifiedFilter} onChange={(e)=>{ setVerifiedFilter(e.target.value as "all" | "verified" | "unverified"); setPage(1);} }>
              <option value="all">Verified: All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={subFilter} onChange={(e)=>{ setSubFilter(e.target.value as "all" | "free" | "premium"); setPage(1);} }>
              <option value="all">Subscription: All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={pageSize} onChange={(e)=> { setPageSize(Number(e.target.value)); setPage(1);} }>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            {loading ? (
              <div className="p-6 text-gray-600">Loading users…</div>
            ) : (
              <>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Verified</th>
                      <th className="px-4 py-3">Subscription</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-4 py-3 text-gray-700">{r.email}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{r.username}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs ${rolePillClass(r.role)}`}>{r.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs ${
                                r.status === "Active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : r.status === "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.verified ? (
                              <span className="px-2 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg text-xs bg-gray-50 text-gray-700 border border-gray-200">Unverified</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              r.subscription === "Premium"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}>
                              {r.subscription}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mr-2"
                              onClick={() => onViewUser(r)}
                            >
                              View
                            </button>
                            {r.status === "Suspended" ? (
                              <button
                                className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => onRestore(r)}
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => onAskSuspend(r)}
                              >
                                Suspend
                              </button>
                            )}
                            
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end items-center gap-2 p-3">
                  <button disabled={page===1} onClick={()=>setPage(1)} className="px-3 py-1 rounded bg-gray-100">First</button>
                  <button disabled={page===1} onClick={()=>setPage(page-1)} className="px-3 py-1 rounded bg-gray-100">Prev</button>
                  <span className="text-sm">Page {page} / {totalPages}</span>
                  <button disabled={page===totalPages} onClick={()=>setPage(page+1)} className="px-3 py-1 rounded bg-gray-100">Next</button>
                  <button disabled={page===totalPages} onClick={()=>setPage(totalPages)} className="px-3 py-1 rounded bg-gray-100">Last</button>
                </div>
              </>
            )}
          </div>

          {/* View details modal */}
          <Modal
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            title="👤 User details"
          >
            {(() => {
              const u = getSelectedApiUser();
              if (!u) return <div className="text-gray-600">No user selected</div>;
              const roleLabel = normalizeRoleLabel(u.role);
              const statusLabel = normalizeStatus(u);
              const subLabel = normalizeSubscription(u.subscription);
              return (
                <div className="min-w-[320px] max-w-[560px]">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={u.avatarUrl || DEFAULT_AVATAR_URL}
                      alt="avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{u.username ?? (u.email ? u.email.split("@")[0] : "—")}</div>
                      <div className="text-gray-600">{u.email ?? "—"}</div>
                    </div>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className={`px-2 py-1 rounded-lg text-xs ${rolePillClass(roleLabel)}`}>{roleLabel}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      statusLabel === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>{statusLabel}</span>
                    {u.emailVerifiedAt ? (
                      <span className="px-2 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-xs bg-gray-50 text-gray-700 border border-gray-200">Unverified</span>
                    )}
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      subLabel === "Premium" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}>{subLabel}</span>
                    <span className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-700">Joined {formatDate(u.createdAt)}</span>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">Points</div>
                      <div className="text-sm font-semibold text-gray-800">{u.points ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">Level</div>
                      <div className="text-sm font-semibold text-gray-800">{u.level ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">Streak (current)</div>
                      <div className="text-sm font-semibold text-gray-800">{u.streakCurrent ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-500">Streak (best)</div>
                      <div className="text-sm font-semibold text-gray-800">{u.streakBest ?? 0}</div>
                    </div>
                  </div>

                  {/* Bio */}
                  {u.bio && (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm">{u.bio}</div>
                  )}

                  {/* Badges */}
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span>🏆</span> Badges
                    </div>
                    {detailsLoading ? (
                      <div className="text-gray-600">Loading badges…</div>
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
            title="⚠️ Suspend user?"
          >
            {(() => {
              const u = getSelectedApiUser();
              const email = u?.email ?? "this user";
              return (
                <div>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to suspend <span className="font-semibold">{email}</span>?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                      onClick={() => setConfirmOpen(false)}
                      disabled={suspending}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 cursor-pointer disabled:opacity-70"
                      onClick={onConfirmSuspend}
                      disabled={suspending}
                    >
                      {suspending ? "Suspending…" : "Suspend"}
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

