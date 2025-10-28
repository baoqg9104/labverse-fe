import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";
import { handleAxiosError } from "../utils/handleAxiosError";
import type { Lab, LabLevel } from "../types/lab";
import {
  FiBarChart2,
  FiEye,
  FiStar,
  FiUsers,
  FiSearch,
  FiLoader,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { BiSortAlt2 } from "react-icons/bi";

// map difficulty levels to lab levels
const mapDifficultyToLabLevel = (difficulty: number): LabLevel => {
  if (difficulty === 0) return "Basic";
  if (difficulty === 1) return "Intermediate";
  if (difficulty === 2) return "Advanced";
  return "Basic";
};

export default function AdminLabs() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"none" | "rating" | "views" | "unique">(
    "none"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [authorNames, setAuthorNames] = useState<Record<number, string>>({});

  const headerStats = useMemo(() => {
    const total = labs.length;
    const avgRating =
      labs.reduce((s, l) => s + (l.ratingAverage ?? 0), 0) / (total || 1);
    const totalViews = labs.reduce((s, l) => s + (l.views ?? 0), 0);
    const totalUnique = labs.reduce((s, l) => s + (l.uniqueUserViews ?? 0), 0);
    return { total, avgRating, totalViews, totalUnique };
  }, [labs]);

  const levelBadgeClass = (level: LabLevel) => {
    switch (level) {
      case "Advanced":
        return "bg-rose-100 text-rose-700";
      case "Intermediate":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/labs", {
          params: { includeInactive: true },
        });
        if (mounted) setLabs(res.data);
      } catch (err) {
        handleAxiosError(err, { fallbackMessage: t("adminLabs.failedLoad") });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  // fetch author names
  useEffect(() => {
    const ids = Array.from(
      new Set(
        labs
          .map((l) => l.authorId)
          .filter((n): n is number => typeof n === "number" && n > 0)
      )
    );

    const missing = ids.filter((id) => authorNames[id] === undefined);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await api.get(`/users/${id}`);
            const u = res.data as {
              username?: string;
              fullName?: string;
              name?: string;
              email?: string;
            };
            const name =
              u?.username ||
              u?.fullName ||
              u?.name ||
              u?.email ||
              `User #${id}`;
            return [id, name] as const;
          } catch {
            return [id, `User #${id}`] as const;
          }
        })
      );
      if (cancelled) return;
      setAuthorNames((prev) => {
        const next = { ...prev };
        for (const [id, name] of pairs) next[id] = name;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [labs, authorNames]);

  const filtered = useMemo(
    () =>
      labs.filter(
        (r) =>
          (!query || r.title.toLowerCase().includes(query.toLowerCase())) &&
          (difficulty === "all" ||
            mapDifficultyToLabLevel(r.difficultyLevel).toLowerCase() ===
              difficulty) &&
          (status === "all" || (r.isActive ? "published" : "hidden") === status)
      ),
    [labs, query, difficulty, status]
  );

  const sorted = useMemo(() => {
    if (sortBy === "none") return filtered;
    return [...filtered].sort((a, b) => {
      const va =
        sortBy === "rating"
          ? a.ratingAverage ?? 0
          : sortBy === "views"
          ? a.views ?? 0
          : a.uniqueUserViews ?? 0;
      const vb =
        sortBy === "rating"
          ? b.ratingAverage ?? 0
          : sortBy === "views"
          ? b.views ?? 0
          : b.uniqueUserViews ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const onToggleActive = async (lab: Lab) => {
    try {
      const id = lab.id;
      if (lab.isActive) await api.delete(`/labs/${id}`);
      else await api.post(`/labs/${id}/restore`);
      setLabs((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: !lab.isActive } : x))
      );
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: "Failed to update lab status" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            <FiShield className="inline-block mr-2" /> {t('adminLabs.title')}
          </h1>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <FiBarChart2 size={18} className="text-blue-500" />
              <span className="text-sm text-gray-700">
                {t('adminLabs.stats.total')}: <strong>{headerStats.total}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <FiStar size={18} className="text-yellow-500" />
              <span className="text-sm text-gray-700">
                {t('adminLabs.stats.avg')}: <strong>{headerStats.avgRating.toFixed(1)}★</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <FiEye size={18} className="text-emerald-500" />
              <span className="text-sm text-gray-700">
                {t('adminLabs.stats.views')}: <strong>{headerStats.totalViews}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <FiUsers size={18} className="text-indigo-500" />
              <span className="text-sm text-gray-700">
                {t('adminLabs.stats.unique')}: <strong>{headerStats.totalUnique}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch
              size={16}
              className="absolute left-3 top-3 text-gray-400 pointer-events-none"
            />
            <input
              className="pl-9 pr-3 py-2 w-full border rounded-lg focus:ring focus:ring-blue-200"
              placeholder={t('adminLabs.searchPlaceholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t('adminLabs.filters.difficultyAll')}</option>
            <option value="basic">{t('adminLabs.filters.basic')}</option>
            <option value="intermediate">{t('adminLabs.filters.intermediate')}</option>
            <option value="advanced">{t('adminLabs.filters.advanced')}</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t('adminLabs.filters.statusAll')}</option>
            <option value="published">{t('adminLabs.filters.published')}</option>
            <option value="hidden">{t('adminLabs.filters.hidden')}</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((v) => (
              <option key={v} value={v}>
                {t("adminLabs.pagination.pages", { count: v })}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <BiSortAlt2
              size={18}
              className="text-gray-500 cursor-pointer"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as "none" | "rating" | "views" | "unique"
                );
                setPage(1);
              }}
            >
              <option value="none">{t("adminLabs.sort.default")}</option>
              <option value="rating">{t("adminLabs.sort.rating")}</option>
              <option value="views">{t("adminLabs.sort.views")}</option>
              <option value="unique">{t("adminLabs.sort.unique")}</option>
            </select>
          </div>
        </div>

        {/* Labs List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <FiLoader className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pageRows.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white border hover:shadow-lg transition relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-lg text-gray-800">
                      {r.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t("adminLabs.by")} {authorNames[r.authorId] ?? `User #${r.authorId}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      r.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.isActive ? t("adminLabs.status.published") : t("adminLabs.status.hidden")}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-center text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${levelBadgeClass(
                        mapDifficultyToLabLevel(r.difficultyLevel)
                      )}`}
                    >
                      {t(
                        `adminLabs.levels.${mapDifficultyToLabLevel(
                          r.difficultyLevel
                        ).toLowerCase()}`
                      )}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 border rounded px-2 py-1">
                      <FiStar size={12} className="text-yellow-500" />
                      {r.ratingAverage?.toFixed(1) ?? "-"}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 border rounded px-2 py-1">
                      <FiEye size={12} />
                      {r.views ?? 0}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 border rounded px-2 py-1">
                      <FiUsers size={12} />
                      {r.uniqueUserViews ?? 0}
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleActive(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      r.isActive
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                    >
                    {r.isActive ? t("adminLabs.actions.hide") : t("adminLabs.actions.publish")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-end items-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            {t("adminLabs.pagination.first")}
          </button>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            {t("adminLabs.pagination.prev")}
          </button>
          <span className="text-sm text-gray-600">
            {t("adminLabs.pagination.page", { page, total: totalPages })}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            {t("adminLabs.pagination.next")}
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            {t("adminLabs.pagination.last")}
          </button>
        </div>
      </div>
    </div>
  );
}
