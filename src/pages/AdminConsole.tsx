import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getRoleMeta, ROLE } from "../components/profile/RoleUtils";
import api from "../utils/axiosInstance";
import { toast } from "react-toastify";

export default function AdminConsole() {
  const { user } = useContext(AuthContext);
  const roleMeta = getRoleMeta(user?.role);

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalLabs, setTotalLabs] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [revenueTo, setRevenueTo] = useState<Date | null>(null);
  const [revenueTransactions, setRevenueTransactions] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userCounts, setUserCounts] = useState<{
    user: number;
    author: number;
    admin: number;
  }>({ user: 0, author: 0, admin: 0 });
  const [labCounts, setLabCounts] = useState<{
    Basic: number;
    Intermediate: number;
    Advanced: number;
  }>({ Basic: 0, Intermediate: 0, Advanced: 0 });
  const [userSubCounts, setUserSubCounts] = useState<{ free: number; premium: number }>({ free: 0, premium: 0 });

  type ApiUser = { role?: number | string | null | undefined; subscription?: string | null | undefined };
  type ApiLab = { difficultyLevel?: string | number | null | undefined };
  type RevenueSummaryDto = {
    from: string;
    to: string;
    totalRevenue: number;
    transactions: number;
    currency: string;
  };

  const normalizeRole = (val: unknown): 0 | 1 | 2 => {
    if (val === 0 || val === 1 || val === 2) return val;
    if (typeof val === "number") {
      const n = Math.trunc(val);
      if (n === 0 || n === 1 || n === 2) return n as 0 | 1 | 2;
    }
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      if (s === "0" || s === "user") return 0;
      if (s === "1" || s === "author") return 1;
      if (s === "2" || s === "admin") return 2;
    }
    return 0;
  };

  const normalizeLevel = (
    val: unknown
  ): "Basic" | "Intermediate" | "Advanced" | null => {
    if (val === "Basic" || val === "Intermediate" || val === "Advanced")
      return val;
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      if (s === "basic" || s === "b" || s === "0") return "Basic";
      if (s === "intermediate" || s === "i" || s === "1") return "Intermediate";
      if (s === "advanced" || s === "a" || s === "2") return "Advanced";
    }
    if (typeof val === "number") {
      if (val === 0) return "Basic";
      if (val === 1) return "Intermediate";
      if (val === 2) return "Advanced";
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [uRes, lRes] = await Promise.all([
          api.get<ApiUser[]>("/users", {
            params: { isOnlyVerifiedUser: true },
          }),
          api.get<ApiLab[]>("/labs"),
        ]);
        if (!mounted) return;

        const users: ApiUser[] = Array.isArray(uRes.data) ? uRes.data : [];
        const labs: ApiLab[] = Array.isArray(lRes.data) ? lRes.data : [];

        const uCounts = users.reduce<{
          user: number;
          author: number;
          admin: number;
        }>(
          (acc, it) => {
            const r = normalizeRole(it.role as unknown);
            if (r === ROLE.USER) acc.user += 1;
            else if (r === ROLE.AUTHOR) acc.author += 1;
            else if (r === ROLE.ADMIN) acc.admin += 1;
            return acc;
          },
          { user: 0, author: 0, admin: 0 }
        );

        // Free vs Premium among normal users
        const subCounts = users.reduce<{ free: number; premium: number }>((acc, it) => {
          const r = normalizeRole(it.role as unknown);
          if (r === ROLE.USER) {
            const sub = (it.subscription ?? "").toString().trim().toLowerCase();
            if (sub === "premium") acc.premium += 1; else acc.free += 1;
          }
          return acc;
        }, { free: 0, premium: 0 });

        const lCounts = labs.reduce<{
          Basic: number;
          Intermediate: number;
          Advanced: number;
        }>(
          (acc, it) => {
            const lvl = normalizeLevel(it.difficultyLevel as unknown);
            if (lvl === "Basic") acc.Basic += 1;
            else if (lvl === "Intermediate") acc.Intermediate += 1;
            else if (lvl === "Advanced") acc.Advanced += 1;
            return acc;
          },
          { Basic: 0, Intermediate: 0, Advanced: 0 }
        );

        setUserCounts(uCounts);
        setLabCounts(lCounts);
        setUserSubCounts(subCounts);
        setTotalUsers(uCounts.user + uCounts.author + uCounts.admin);
        setTotalLabs(lCounts.Basic + lCounts.Intermediate + lCounts.Advanced);
        // Fetch revenue summary (no date filter for now; backend defaults)
        try {
          const revRes = await api.get<RevenueSummaryDto>("/admin/revenue", {
            params: { to: new Date().toISOString() },
          });
          const dto = revRes.data;
          // Backend returns ISO strings; convert to Date for display
          setRevenue(dto.totalRevenue ?? 0);
          setRevenueTransactions(dto.transactions ?? 0);
          setRevenueTo(dto.to ? new Date(dto.to) : null);
        } catch {
          // If revenue call fails, keep revenue as null and continue
          setRevenue(null);
          setRevenueTransactions(null);
          setRevenueTo(null);
        }
      } catch {
        if (mounted) {
          toast.error("Failed to load admin metrics");
          setUserCounts({ user: 0, author: 0, admin: 0 });
          setLabCounts({ Basic: 0, Intermediate: 0, Advanced: 0 });
          setTotalUsers(0);
          setTotalLabs(0);
          setRevenue(null);
          setRevenueTransactions(null);
          setRevenueTo(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedRevenue = useMemo(
    () =>
      revenue === null
        ? "N/A"
        : new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(revenue ?? 0),
    [revenue]
  );

  const formattedAsOf = useMemo(() => {
    if (!revenueTo) return null;
    const fmt = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(revenueTo);
  }, [revenueTo]);

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Console
              </h1>
              <p className="text-gray-600">
                Manage users, labs, reports, and revenue
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${roleMeta.badgeClass}`}
            >
              {roleMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl mb-3">
                👥
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "…" : totalUsers ?? 0}
              </div>
              <div className="text-gray-600">Total Users</div>
              <div className="text-xs text-gray-500 mt-1">
                {loading
                  ? ""
                  : `Premium: ${userSubCounts.premium} • Free: ${userSubCounts.free}`}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-900 flex items-center gap-1">
                  <span role="img" aria-label="User">
                    🧑
                  </span>{" "}
                  User: {loading ? "…" : userCounts.user}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-900 flex items-center gap-1">
                  <span role="img" aria-label="Author">
                    ✍️
                  </span>{" "}
                  Author: {loading ? "…" : userCounts.author}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-900 flex items-center gap-1">
                  <span role="img" aria-label="Admin">
                    🛡️
                  </span>{" "}
                  Admin: {loading ? "…" : userCounts.admin}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-xl mb-3">
                🗒️
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "…" : totalLabs ?? 0}
              </div>
              <div className="text-gray-600">Total Labs</div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-900 flex items-center gap-1">
                  <span role="img" aria-label="Basic">
                    🔰
                  </span>{" "}
                  Basic: {loading ? "…" : labCounts.Basic}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-orange-900 flex items-center gap-1">
                  <span role="img" aria-label="Intermediate">
                    ⚡
                  </span>{" "}
                  Intermediate: {loading ? "…" : labCounts.Intermediate}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pink-100 border border-pink-300 text-pink-900 flex items-center gap-1">
                  <span role="img" aria-label="Advanced">
                    🚀
                  </span>{" "}
                  Advanced: {loading ? "…" : labCounts.Advanced}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow opacity-90">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xl mb-3">
                💰
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "…" : formattedRevenue}
              </div>
              <div className="text-gray-600">Revenue (VND)</div>
              <div className="text-xs text-gray-500 mt-2">
                {loading ? "" : formattedAsOf ? `As of: ${formattedAsOf}` : "As of: N/A"}
              </div>
              <div className="text-xs text-gray-500">
                {loading
                  ? ""
                  : revenueTransactions !== null
                    ? `Transactions: ${revenueTransactions}`
                    : "Transactions: N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
